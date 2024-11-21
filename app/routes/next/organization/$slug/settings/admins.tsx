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
  cancelOrganizationAdminInvitation,
  getOrganizationWithAdmins,
  getPendingAdminInvitesOfOrganization,
  inviteProfileToBeOrganizationAdmin,
  removeAdminFromOrganization,
} from "./admins.server";
import { FormEvent } from "react";

const i18nNS = [
  "routes/next/organization/settings/admins",
  ...searchProfilesI18nNS,
];
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

  const organization = await getOrganizationWithAdmins(slug, authClient);
  invariantResponse(organization !== null, t("error.invariant.notFound"), {
    status: 404,
  });

  const pendingAdminInvites = await getPendingAdminInvitesOfOrganization(
    organization.id,
    authClient
  );

  const pendingAndCurrentAdminIds = [
    ...organization.admins.map((relation) => relation.profile.id),
    ...pendingAdminInvites.map((invite) => invite.id),
  ];
  const { searchedProfiles, submission } = await searchProfiles({
    searchParams: new URL(request.url).searchParams,
    idsToExclude: pendingAndCurrentAdminIds,
    authClient,
    t,
    mode,
  });

  return {
    organization,
    pendingAdminInvites,
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

  if (intent.startsWith("invite-admin-")) {
    const inviteFormData = new FormData();
    inviteFormData.set("profileId", intent.replace("invite-admin-", ""));
    result = await inviteProfileToBeOrganizationAdmin({
      formData: inviteFormData,
      slug,
      t,
    });
  } else if (intent.startsWith("cancel-admin-invite-")) {
    // TODO: Check locales and i18NS if it contains all calls inside below function
    const cancelAdminInviteFormData = new FormData();
    cancelAdminInviteFormData.set(
      "profileId",
      intent.replace("cancel-admin-invite-", "")
    );
    result = await cancelOrganizationAdminInvitation({
      formData: cancelAdminInviteFormData,
      slug,
      t,
    });
  } else if (intent.startsWith("remove-admin-")) {
    const removeAdminFormData = new FormData();
    removeAdminFormData.set("profileId", intent.replace("remove-admin-", ""));
    result = await removeAdminFromOrganization({
      formData: removeAdminFormData,
      slug,
      t,
    });
  } else {
    invariantResponse(false, t("error.invariant.wrongIntent"), {
      status: 400,
    });
  }

  if (result.toast !== undefined) {
    return redirectWithToast(request.url, result.toast);
  }
  return { submission: result.submission };
};

function Admins() {
  const {
    organization,
    pendingAdminInvites,
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
  // TODO: Optimistic UI and check mount and unmount behaviour on ListContainer and ListItem
  const [inviteAdminForm] = useForm({
    id: "invite-admins",
    lastResult: actionSubmission,
  });

  const [cancelAdminInviteForm] = useForm({
    id: "cancel-admin-invites",
    lastResult: actionSubmission,
  });

  const [removeAdminForm] = useForm({
    id: "remove-admins",
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
              count: organization.admins.length,
            })}
          </h2>
          <Form
            {...getFormProps(removeAdminForm)}
            method="post"
            preventScrollReset
          >
            <ListContainer>
              {organization.admins.map((relation) => {
                return (
                  <ListItem
                    key={`organization-admin-${relation.profile.username}`}
                    entity={relation.profile}
                  >
                    {organization.admins.length > 1 && (
                      <Button
                        name="intent"
                        variant="outline"
                        value={`remove-admin-${relation.profile.id}`}
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
              {...getFormProps(inviteAdminForm)}
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
                        value={`invite-admin-${profile.id}`}
                        type="submit"
                        fullSize
                        onChange={(event: FormEvent<HTMLButtonElement>) => {
                          // TODO:
                          // Set fade out state and pass it to list and list item
                          // setTimeout to 150ms
                          // Test with optimistic ui
                          submit(event.currentTarget, {
                            preventScrollReset: true,
                          });
                        }}
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
          {pendingAdminInvites.length > 0 ? (
            <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
              <h4 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                {t("content.invites.headline")}
              </h4>
              <p>{t("content.invites.intro")} </p>
              <Form
                {...getFormProps(cancelAdminInviteForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer>
                  {pendingAdminInvites.map((profile) => {
                    return (
                      <ListItem
                        key={`pending-admin-invite-${profile.username}`}
                        entity={profile}
                      >
                        <Button
                          name="intent"
                          variant="outline"
                          value={`cancel-admin-invite-${profile.id}`}
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

export default Admins;
