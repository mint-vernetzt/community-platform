import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
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
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { searchProfilesSchema } from "~/form-helpers";
import { SearchProfiles, Deep } from "~/lib/utils/searchParams";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { BackButton } from "~/components-next/BackButton";
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
import { languageModuleMap } from "~/locales/.server";
import { decideBetweenSingularOrPlural } from "~/lib/utils/i18n";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/organization/$slug/settings/team"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = deriveMode(sessionUser);

  const organization = await getOrganizationWithTeamMembers({
    slug,
    authClient,
    locales,
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
    locales,
    mode,
  });

  return {
    organization,
    pendingTeamMemberInvites,
    searchedProfiles,
    submission,
    locales,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/organization/$slug/settings/team"];

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
    locales.route.error.invariant.noStringIntent,
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
      locales,
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
      locales,
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
      locales,
    });
  } else {
    invariantResponse(false, locales.route.error.invariant.wrongIntent, {
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
    locales,
  } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const location = useLocation();

  const [searchForm, searchFields] = useForm({
    id: "search-profiles",
    defaultValue: {
      [SearchProfiles]: searchParams.get(SearchProfiles) || undefined,
    },
    constraint: getZodConstraint(searchProfilesSchema(locales)),
    // Client side validation onInput, server side validation on submit
    shouldValidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: searchProfilesSchema(locales),
      });
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? loaderSubmission : null,
  });

  const [inviteTeamMemberForm] = useForm({
    id: "invite-team-members",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const [cancelTeamMemberInviteForm] = useForm({
    id: "cancel-team-member-invites",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const [removeTeamMemberForm] = useForm({
    id: "remove-team-members",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  return (
    <Section>
      <BackButton to={location.pathname}>
        {locales.route.content.headline}
      </BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.intro}</p>

      {/* Current Admins and Remove Section */}
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {decideBetweenSingularOrPlural(
              locales.route.content.current.headline_one,
              locales.route.content.current.headline_other,
              organization.teamMembers.length
            )}
          </h2>
          <Form
            {...getFormProps(removeTeamMemberForm)}
            method="post"
            preventScrollReset
          >
            <ListContainer locales={locales}>
              {organization.teamMembers.map((relation) => {
                return (
                  <ListItem
                    key={`organization-team-member-${relation.profile.username}`}
                    entity={relation.profile}
                    locales={locales}
                  >
                    {organization.teamMembers.length > 1 && (
                      <Button
                        name="intent"
                        variant="outline"
                        value={`remove-team-member-${relation.profile.id}`}
                        type="submit"
                        fullSize
                      >
                        {locales.route.content.current.remove}
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
            {locales.route.content.add.headline}
          </h2>
          <Form
            {...getFormProps(searchForm)}
            method="get"
            onChange={(event) => {
              searchForm.validate();
              if (searchForm.valid) {
                submit(event.currentTarget, { preventScrollReset: true });
              }
            }}
            autoComplete="off"
          >
            <Input name={Deep} defaultValue="true" type="hidden" />
            <Input
              {...getInputProps(searchFields[SearchProfiles], {
                type: "search",
              })}
              key={searchFields[SearchProfiles].id}
              standalone
            >
              <Input.Label htmlFor={searchFields[SearchProfiles].id}>
                {locales.route.content.add.search}
              </Input.Label>
              <Input.SearchIcon />

              {typeof searchFields[SearchProfiles].errors !== "undefined" &&
              searchFields[SearchProfiles].errors.length > 0 ? (
                searchFields[SearchProfiles].errors.map((error) => (
                  <Input.Error
                    id={searchFields[SearchProfiles].errorId}
                    key={error}
                  >
                    {error}
                  </Input.Error>
                ))
              ) : (
                <Input.HelperText>
                  {locales.route.content.add.criteria}
                </Input.HelperText>
              )}
              <Input.Controls>
                <noscript>
                  <Button type="submit" variant="outline">
                    {locales.route.content.add.submitSearch}
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
              <ListContainer locales={locales}>
                {searchedProfiles.map((profile) => {
                  return (
                    <ListItem
                      key={`profile-search-result-${profile.username}`}
                      entity={profile}
                      locales={locales}
                    >
                      <Button
                        name="intent"
                        variant="outline"
                        value={`invite-team-member-${profile.id}`}
                        type="submit"
                        fullSize
                      >
                        {locales.route.content.add.submit}
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
                {locales.route.content.invites.headline}
              </h4>
              <p>{locales.route.content.invites.intro} </p>
              <Form
                {...getFormProps(cancelTeamMemberInviteForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer locales={locales}>
                  {pendingTeamMemberInvites.map((profile) => {
                    return (
                      <ListItem
                        key={`pending-team-member-invite-${profile.username}`}
                        entity={profile}
                        locales={locales}
                      >
                        <Button
                          name="intent"
                          variant="outline"
                          value={`cancel-team-member-invite-${profile.id}`}
                          type="submit"
                          fullSize
                        >
                          {locales.route.content.invites.cancel}
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
