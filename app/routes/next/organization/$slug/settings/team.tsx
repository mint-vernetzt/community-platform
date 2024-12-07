import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint } from "@conform-to/zod-v1";
import { Button, Input, Section } from "@mint-vernetzt/components";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import {
  DeepSearchParam,
  searchProfilesI18nNS,
  searchProfilesSchema,
  SearchProfilesSearchParam,
} from "~/form-helpers";
import i18next from "~/i18next.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { ListContainer, ListItem } from "~/routes/my/__components";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { BackButton } from "~/routes/project/$slug/settings/__components";
import { searchProfiles } from "~/routes/utils.server";
import { redirectWithToast } from "~/toast.server";
import { deriveMode } from "~/utils.server";
import {
  cancelOrganizationTeamMemberInvitation,
  getOrganizationWithTeamMembers,
  getPendingTeamMemberInvitesOfOrganization,
  inviteProfileToBeOrganizationTeamMember,
  removeTeamMemberFromOrganization,
} from "./team.server";

const i18nNS = [
  "routes/next/organization/settings/team",
  ...searchProfilesI18nNS,
] as const;
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = deriveMode(sessionUser);

  const organization = await getOrganizationWithTeamMembers({
    slug,
    authClient,
    t,
  });

  const pendingTeamMemberInvites =
    await getPendingTeamMemberInvitesOfOrganization(
      organization.id,
      authClient
    );

  const pendingAndCurrentTeamMemberIds = [
    ...organization.teamMembers.map((relation) => relation.profile.id),
    ...pendingTeamMemberInvites.map((invite) => invite.id),
  ];
  const { searchedProfiles, submission } = await searchProfiles({
    searchParams: new URL(request.url).searchParams,
    idsToExclude: pendingAndCurrentTeamMemberIds,
    authClient,
    t,
    mode,
  });

  return {
    organization,
    pendingTeamMemberInvites,
    searchedProfiles,
    submission,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  await checkFeatureAbilitiesOrThrow(authClient, ["next-organization-create"]);

  let result;
  const formData = await request.formData();
  const intent = formData.get("intent");
  invariantResponse(
    typeof intent === "string",
    t("error.invariant.noStringIntent"),
    {
      status: 400,
    }
  );

  if (intent.startsWith("invite-team-member-")) {
    const inviteFormData = new FormData();
    inviteFormData.set("profileId", intent.replace("invite-team-member-", ""));
    result = await inviteProfileToBeOrganizationTeamMember({
      formData: inviteFormData,
      slug,
      t,
    });
  } else if (intent.startsWith("cancel-team-member-invite-")) {
    const cancelAdminInviteFormData = new FormData();
    cancelAdminInviteFormData.set(
      "profileId",
      intent.replace("cancel-team-member-invite-", "")
    );
    result = await cancelOrganizationTeamMemberInvitation({
      formData: cancelAdminInviteFormData,
      slug,
      t,
    });
  } else if (intent.startsWith("remove-team-member-")) {
    const removeAdminFormData = new FormData();
    removeAdminFormData.set(
      "profileId",
      intent.replace("remove-team-member-", "")
    );
    result = await removeTeamMemberFromOrganization({
      formData: removeAdminFormData,
      slug,
      t,
    });
  } else {
    invariantResponse(false, t("error.invariant.wrongIntent"), {
      status: 400,
    });
  }

  if (
    result.submission !== undefined &&
    result.submission.status === "success" &&
    result.toast !== undefined
  ) {
    return redirectWithToast(request.url, result.toast);
  }
  return { submission: result.submission };
};

function Team() {
  const {
    organization,
    pendingTeamMemberInvites,
    searchedProfiles,
    submission: loaderSubmission,
  } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const actionSubmission = actionData?.submission;

  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const location = useLocation();
  const { t } = useTranslation(i18nNS);

  const [searchForm, searchFields] = useForm({
    id: "search-profiles",
    lastResult: loaderSubmission,
    constraint: getZodConstraint(searchProfilesSchema(t)),
    defaultValue: {
      [SearchProfilesSearchParam]:
        searchParams.get(SearchProfilesSearchParam) || undefined,
    },
  });

  const [inviteTeamMemberForm] = useForm({
    id: "invite-team-members",
    lastResult: actionSubmission,
  });

  const [cancelTeamMemberInviteForm] = useForm({
    id: "cancel-team-member-invites",
    lastResult: actionSubmission,
  });

  const [removeTeamMemberForm] = useForm({
    id: "remove-team-members",
    lastResult: actionSubmission,
  });

  return (
    <Section>
      <BackButton to={location.pathname}>{t("content.headline")}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{t("content.intro")}</p>

      {/* Current Admins and Remove Section */}
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {t("content.current.headline", {
              count: organization.teamMembers.length,
            })}
          </h2>
          <Form
            {...getFormProps(removeTeamMemberForm)}
            method="post"
            preventScrollReset
          >
            <ListContainer>
              {organization.teamMembers.map((relation) => {
                return (
                  <ListItem
                    key={`organization-team-member-${relation.profile.username}`}
                    entity={relation.profile}
                  >
                    {organization.teamMembers.length > 1 && (
                      <Button
                        name="intent"
                        variant="outline"
                        value={`remove-team-member-${relation.profile.id}`}
                        type="submit"
                        fullSize
                      >
                        {t("content.current.remove")}
                      </Button>
                    )}
                  </ListItem>
                );
              })}
            </ListContainer>
          </Form>
        </div>
        {/* Search Profiles To Add Section */}
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {t("content.add.headline")}
          </h2>
          <Form
            {...getFormProps(searchForm)}
            method="get"
            onChange={(event) => {
              submit(event.currentTarget, { preventScrollReset: true });
            }}
          >
            <Input name={DeepSearchParam} defaultValue="true" type="hidden" />
            <Input
              {...getInputProps(searchFields[SearchProfilesSearchParam], {
                type: "search",
              })}
              key={searchFields[SearchProfilesSearchParam].id}
              standalone
            >
              <Input.Label htmlFor={searchFields[SearchProfilesSearchParam].id}>
                {t("content.add.search")}
              </Input.Label>
              <Input.SearchIcon />

              {typeof searchFields[SearchProfilesSearchParam].errors !==
                "undefined" &&
              searchFields[SearchProfilesSearchParam].errors.length > 0 ? (
                searchFields[SearchProfilesSearchParam].errors.map((error) => (
                  <Input.Error key={error}>{error}</Input.Error>
                ))
              ) : (
                <Input.HelperText>{t("content.add.criteria")}</Input.HelperText>
              )}
              <Input.Controls>
                <noscript>
                  <Button type="submit" variant="outline">
                    {t("content.add.submitSearch")}
                  </Button>
                </noscript>
              </Input.Controls>
            </Input>
          </Form>
          {searchedProfiles.length > 0 ? (
            <Form
              {...getFormProps(inviteTeamMemberForm)}
              method="post"
              preventScrollReset
            >
              <ListContainer>
                {searchedProfiles.map((profile) => {
                  return (
                    <ListItem
                      key={`profile-search-result-${profile.username}`}
                      entity={profile}
                    >
                      <Button
                        name="intent"
                        variant="outline"
                        value={`invite-team-member-${profile.id}`}
                        type="submit"
                        fullSize
                      >
                        {t("content.add.submit")}
                      </Button>
                    </ListItem>
                  );
                })}
              </ListContainer>
            </Form>
          ) : null}
          {/* Pending Invites Section */}
          {pendingTeamMemberInvites.length > 0 ? (
            <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
              <h4 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                {t("content.invites.headline")}
              </h4>
              <p>{t("content.invites.intro")} </p>
              <Form
                {...getFormProps(cancelTeamMemberInviteForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer>
                  {pendingTeamMemberInvites.map((profile) => {
                    return (
                      <ListItem
                        key={`pending-team-member-invite-${profile.username}`}
                        entity={profile}
                      >
                        <Button
                          name="intent"
                          variant="outline"
                          value={`cancel-team-member-invite-${profile.id}`}
                          type="submit"
                          fullSize
                        >
                          {t("content.invites.cancel")}
                        </Button>
                      </ListItem>
                    );
                  })}
                </ListContainer>
              </Form>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

export default Team;
