import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import {
  Form,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BackButton } from "~/components-next/BackButton";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import { searchProfilesSchema } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { decideBetweenSingularOrPlural } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { Deep, SearchProfiles } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { searchProfiles } from "~/routes/utils.server";
import { redirectWithToast } from "~/toast.server";
import { deriveMode } from "~/utils.server";
import {
  addTeamMemberToProject,
  getProjectWithTeamMembers,
  removeTeamMemberFromProject,
} from "./team.server";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/settings/team"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = deriveMode(sessionUser);

  const project = await getProjectWithTeamMembers({
    slug,
    authClient,
    locales,
  });

  // TODO: Implement this when project team member invites are implemented
  // const pendingTeamMemberInvites = await getPendingTeamMemberInvitesOfProject(
  //   project.id,
  //   authClient
  // );

  const { searchedProfiles, submission } = await searchProfiles({
    searchParams: new URL(request.url).searchParams,
    authClient,
    locales,
    mode,
  });

  return {
    project,
    // pendingTeamMemberInvites,
    searchedProfiles,
    submission,
    locales,
    currentTimestamp: Date.now(),
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/settings/team"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

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

  // TODO: Remove this when project team member invites are implemented
  if (intent.startsWith("add-team-member-")) {
    const addTeamMemberFormData = new FormData();
    addTeamMemberFormData.set(
      "profileId",
      intent.replace("add-team-member-", "")
    );
    result = await addTeamMemberToProject({
      formData: addTeamMemberFormData,
      slug,
      locales,
    });
  }
  // TODO: Implement this when project team member invites are implemented
  // else if (intent.startsWith("invite-team-member-")) {
  //   const inviteFormData = new FormData();
  //   inviteFormData.set("profileId", intent.replace("invite-team-member-", ""));
  //   result = await inviteProfileToBeProjectTeamMember({
  //     formData: inviteFormData,
  //     slug,
  //     locales,
  //   });
  // } else if (intent.startsWith("cancel-team-member-invite-")) {
  //   const cancelTeamMemberInviteFormData = new FormData();
  //   cancelTeamMemberInviteFormData.set(
  //     "profileId",
  //     intent.replace("cancel-team-member-invite-", "")
  //   );
  //   result = await cancelProjectTeamMemberInvitation({
  //     formData: cancelTeamMemberInviteFormData,
  //     slug,
  //     locales,
  //   });
  // }
  else if (intent.startsWith("remove-team-member-")) {
    const removeTeamMemberFormData = new FormData();
    removeTeamMemberFormData.set(
      "profileId",
      intent.replace("remove-team-member-", "")
    );
    result = await removeTeamMemberFromProject({
      formData: removeTeamMemberFormData,
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
  return { currentTimestamp: Date.now(), submission: result.submission };
};

function Team() {
  const {
    project,
    // pendingTeamMemberInvites,
    searchedProfiles: loaderSearchedProfiles,
    submission: loaderSubmission,
    locales,
    currentTimestamp,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const location = useLocation();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const searchFetcher = useFetcher<typeof loader>();
  const searchedProfiles =
    searchFetcher.data !== undefined
      ? searchFetcher.data.searchedProfiles
      : loaderSearchedProfiles;
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

  // TODO: Remove this when project team member invites are implemented
  const [addTeamMemberForm] = useForm({
    id: `add-team-members-${actionData?.currentTimestamp || currentTimestamp}`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  // TODO: Implement this when project team member invites are implemented
  // const [inviteTeamMemberForm] = useForm({
  //   id: `invite-team-member-${
  //     actionData?.currentTimestamp || currentTimestamp
  //   }`,
  //   lastResult: navigation.state === "idle" ? actionData?.submission : null,
  // });

  // const [cancelTeamMemberInviteForm] = useForm({
  //   id: `cancel-team-member-invite-${
  //     actionData?.currentTimestamp || currentTimestamp
  //   }`,
  //   lastResult: navigation.state === "idle" ? actionData?.submission : null,
  // });

  const [removeTeamMemberForm] = useForm({
    id: `remove-team-member-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  return (
    <Section>
      <BackButton to={location.pathname}>
        {locales.route.content.headline}
      </BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.intro}</p>

      {/* Current Team Members and Remove Section */}
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {decideBetweenSingularOrPlural(
              locales.route.content.current.headline_one,
              locales.route.content.current.headline_other,
              project.teamMembers.length
            )}
          </h2>
          <Form
            {...getFormProps(removeTeamMemberForm)}
            method="post"
            preventScrollReset
          >
            <ListContainer
              locales={locales}
              listKey="team-members"
              hideAfter={3}
            >
              {project.teamMembers.map((relation, index) => {
                return (
                  <ListItem
                    key={`team-member-${relation.profile.username}`}
                    entity={relation.profile}
                    locales={locales}
                    listIndex={index}
                    hideAfter={3}
                  >
                    {project.teamMembers.length > 1 && (
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
            {typeof removeTeamMemberForm.errors !== "undefined" &&
            removeTeamMemberForm.errors.length > 0 ? (
              <div>
                {removeTeamMemberForm.errors.map((error, index) => {
                  return (
                    <div
                      id={removeTeamMemberForm.errorId}
                      key={index}
                      className="mv-text-sm mv-font-semibold mv-text-negative-600"
                    >
                      {error}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </Form>
        </div>
        {/* Search And Add Team Members Section */}
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {locales.route.content.add.headline}
          </h2>
          <searchFetcher.Form
            {...getFormProps(searchForm)}
            method="get"
            onChange={(event) => {
              searchForm.validate();
              if (searchForm.valid) {
                searchFetcher.submit(event.currentTarget, {
                  preventScrollReset: true,
                });
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
              <Input.ClearIcon
                onClick={() => {
                  setTimeout(() => {
                    searchForm.reset();
                    searchFetcher.submit(null, {
                      preventScrollReset: true,
                    });
                  }, 0);
                }}
              />
              <Input.Controls>
                <noscript>
                  <Button type="submit" variant="outline">
                    {locales.route.content.add.submitSearch}
                  </Button>
                </noscript>
              </Input.Controls>
            </Input>
            {typeof searchForm.errors !== "undefined" &&
            searchForm.errors.length > 0 ? (
              <div>
                {searchForm.errors.map((error, index) => {
                  return (
                    <div
                      id={searchForm.errorId}
                      key={index}
                      className="mv-text-sm mv-font-semibold mv-text-negative-600"
                    >
                      {error}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </searchFetcher.Form>
          {searchedProfiles.length > 0 ? (
            <Form
              {...getFormProps(addTeamMemberForm)}
              method="post"
              preventScrollReset
            >
              <ListContainer
                locales={locales}
                listKey="team-member-search-results"
                hideAfter={3}
              >
                {searchedProfiles.map((searchedProfile, index) => {
                  return (
                    <ListItem
                      key={`team-member-search-result-${searchedProfile.username}`}
                      entity={searchedProfile}
                      locales={locales}
                      listIndex={index}
                      hideAfter={3}
                    >
                      {project.teamMembers.some((teamMember) => {
                        return teamMember.profile.id === searchedProfile.id;
                      }) ? (
                        <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-positive-600 mv-text-sm mv-font-semibold mv-leading-5">
                          {locales.route.content.add.alreadyMember}
                        </div>
                      ) : (
                        // TODO: Implement this when project team member invites are implemented
                        // pendingTeamMemberInvites.some((relation) => {
                        //     return (
                        //       relation.profile.id === searchedProfile.id
                        //     );
                        //   }) ? (
                        //   <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-neutral-700 mv-text-sm mv-font-semibold mv-leading-5">
                        //     {
                        //       locales.route.content.add
                        //         .alreadyInvited
                        //     }
                        //   </div>
                        // ) :
                        <Button
                          name="intent"
                          variant="outline"
                          value={`add-team-member-${searchedProfile.id}`}
                          type="submit"
                          fullSize
                        >
                          {locales.route.content.add.submit}
                        </Button>
                      )}
                    </ListItem>
                  );
                })}
              </ListContainer>
              {typeof addTeamMemberForm.errors !== "undefined" &&
              addTeamMemberForm.errors.length > 0 ? (
                <div>
                  {addTeamMemberForm.errors.map((error, index) => {
                    return (
                      <div
                        id={addTeamMemberForm.errorId}
                        key={index}
                        className="mv-text-sm mv-font-semibold mv-text-negative-600"
                      >
                        {error}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </Form>
          ) : null}
          {/* TODO: Implement this when project team member invites are implemented */}
          {/* Search Profiles To Invite As Team Member Section */}
          {/* <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {locales.route.content.invite.headline}
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
                {locales.route.content.invite.search}
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
                  {locales.route.content.invite.criteria}
                </Input.HelperText>
              )}
              <Input.Controls>
                <noscript>
                  <Button type="submit" variant="outline">
                    {locales.route.content.invite.submitSearch}
                  </Button>
                </noscript>
              </Input.Controls>
            </Input>
            {typeof searchForm.errors !== "undefined" &&
            searchForm.errors.length > 0 ? (
              <div>
                {searchForm.errors.map((error, index) => {
                  return (
                    <div
                      id={searchForm.errorId}
                      key={index}
                      className="mv-text-sm mv-font-semibold mv-text-negative-600"
                    >
                      {error}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </Form>
          {searchedProfiles.length > 0 ? (
            <Form
              {...getFormProps(inviteTeamMemberForm)}
              method="post"
              preventScrollReset
            >
              <ListContainer
                locales={locales}
                listKey="team-member-search-results"
                hideAfter={3}
              >
                {searchedProfiles.map((profile, index) => {
                  return (
                    <ListItem
                      key={`team-member-search-result-${profile.username}`}
                      entity={profile}
                      locales={locales}
                      listIndex={index}
                      hideAfter={3}
                    >
                      <Button
                        name="intent"
                        variant="outline"
                        value={`invite-team-member-${profile.id}`}
                        type="submit"
                        fullSize
                      >
                        {locales.route.content.invite.submit}
                      </Button>
                    </ListItem>
                  );
                })}
              </ListContainer>
              {typeof inviteTeamMemberForm.errors !== "undefined" &&
              inviteTeamMemberForm.errors.length > 0 ? (
                <div>
                  {inviteTeamMemberForm.errors.map((error, index) => {
                    return (
                      <div
                        id={inviteTeamMemberForm.errorId}
                        key={index}
                        className="mv-text-sm mv-font-semibold mv-text-negative-600"
                      >
                        {error}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </Form>
          ) : null} */}
          {/* Pending Invites Section */}
          {/* {pendingTeamMemberInvites.length > 0 ? (
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
                <ListContainer
                  locales={locales}
                  listKey="pending-team-member-invites"
                  hideAfter={3}
                >
                  {pendingTeamMemberInvites.map((profile, index) => {
                    return (
                      <ListItem
                        key={`pending-team-member-invite-${profile.username}`}
                        entity={profile}
                        locales={locales}
                        listIndex={index}
                        hideAfter={3}
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
                {typeof cancelTeamMemberInviteForm.errors !== "undefined" &&
                cancelTeamMemberInviteForm.errors.length > 0 ? (
                  <div>
                    {cancelTeamMemberInviteForm.errors.map((error, index) => {
                      return (
                        <div
                          id={cancelTeamMemberInviteForm.errorId}
                          key={index}
                          className="mv-text-sm mv-font-semibold mv-text-negative-600"
                        >
                          {error}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </Form>
            </div>
          ) : null} */}
        </div>
      </div>
    </Section>
  );
}

export default Team;
