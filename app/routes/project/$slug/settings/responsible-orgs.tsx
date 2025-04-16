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
import { searchOrganizationsSchema } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { decideBetweenSingularOrPlural } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { Deep, SearchOrganizations } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { searchOrganizations } from "~/routes/utils.server";
import { redirectWithToast } from "~/toast.server";
import { deriveMode } from "~/utils.server";
import {
  addResponsibleOrganizationToProject,
  getOwnOrganizationSuggestions,
  getProjectWithResponsibleOrganizations,
  removeResponsibleOrganizationFromProject,
} from "./responsible-orgs.server";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/responsible-orgs"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = deriveMode(sessionUser);

  const project = await getProjectWithResponsibleOrganizations({
    slug,
    authClient,
    locales,
  });

  // TODO: Implement this when project responsible organization invites are implemented
  // const pendingResponsibleOrganizationInvites = await getPendingResponsibleOrganizationInvitesOfProject(
  //   project.id,
  //   authClient
  // );

  const ownOrganizationSuggestions = await getOwnOrganizationSuggestions({
    sessionUser,
    authClient,
  });

  const { searchedOrganizations, submission } = await searchOrganizations({
    searchParams: new URL(request.url).searchParams,
    authClient,
    locales,
    mode,
  });

  return {
    project,
    ownOrganizationSuggestions,
    // pendingResponsibleOrganizationInvites,
    searchedOrganizations,
    submission,
    locales,
    currentTimestamp: Date.now(),
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/responsible-orgs"];

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

  // TODO: Remove this when project responsible organization invites are implemented
  if (intent.startsWith("add-responsible-organization-")) {
    const addResponsibleOrganizationFormData = new FormData();
    addResponsibleOrganizationFormData.set(
      "organizationId",
      intent.replace("add-responsible-organization-", "")
    );
    result = await addResponsibleOrganizationToProject({
      formData: addResponsibleOrganizationFormData,
      slug,
      locales,
    });
  }
  // TODO: Implement this when project responsible organizations invites are implemented
  // else if (intent.startsWith("invite-responsible-organization-")) {
  //   const inviteFormData = new FormData();
  //   inviteFormData.set("organizationId", intent.replace("invite-responsible-organization-", ""));
  //   result = await inviteOrganizationToBeResponsibleForProject({
  //     formData: inviteFormData,
  //     slug,
  //     locales,
  //   });
  // } else if (intent.startsWith("cancel-responsible-organization-invite-")) {
  //   const cancelResponsibleOrganizationInviteFormData = new FormData();
  //   cancelResponsibleOrganizationInviteFormData.set(
  //     "organizationId",
  //     intent.replace("cancel-responsible-organization-invite-", "")
  //   );
  //   result = await cancelResponsibleOrganizationForProjectInvitation({
  //     formData: cancelResponsibleOrganizationInviteFormData,
  //     slug,
  //     locales,
  //   });
  // }
  else if (intent.startsWith("remove-responsible-organization-")) {
    const removeResponsibleOrganizationFormData = new FormData();
    removeResponsibleOrganizationFormData.set(
      "organizationId",
      intent.replace("remove-responsible-organization-", "")
    );
    result = await removeResponsibleOrganizationFromProject({
      formData: removeResponsibleOrganizationFormData,
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
    ownOrganizationSuggestions,
    // pendingResponsibleOrganizationInvites,
    searchedOrganizations: loaderSearchedOrganizations,
    submission: loaderSubmission,
    locales,
    currentTimestamp,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const location = useLocation();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const searchFetcher = useFetcher<typeof loader>();
  const searchedOrganizations =
    searchFetcher.data !== undefined
      ? searchFetcher.data.searchedOrganizations
      : loaderSearchedOrganizations;
  const [searchForm, searchFields] = useForm({
    id: "search-organizations",
    defaultValue: {
      [SearchOrganizations]: searchParams.get(SearchOrganizations) || undefined,
    },
    constraint: getZodConstraint(searchOrganizationsSchema(locales)),
    // Client side validation onInput, server side validation on submit
    shouldValidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: searchOrganizationsSchema(locales),
      });
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? loaderSubmission : null,
  });

  // TODO: Remove this when project responsible organization invites are implemented
  const [addResponsibleOrganizationForm] = useForm({
    id: `add-responsible-organizations-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const [addOwnOrganizationForm] = useForm({
    id: `add-own-organization-${
      actionData?.currentTimestamp || currentTimestamp
    }`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  // TODO: Implement this when project responsible organization invites are implemented
  // const [inviteResponsibleOrganizationForm] = useForm({
  //   id: `invite-responsible-organization-${
  //     actionData?.currentTimestamp || currentTimestamp
  //   }`,
  //   lastResult: navigation.state === "idle" ? actionData?.submission : null,
  // });

  // const [cancelResponsibleOrganizationInviteForm] = useForm({
  //   id: `cancel-responsible-organization-invite-${
  //     actionData?.currentTimestamp || currentTimestamp
  //   }`,
  //   lastResult: navigation.state === "idle" ? actionData?.submission : null,
  // });

  const [removeResponsibleOrganizationForm] = useForm({
    id: `remove-responsible-organization-${
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

      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        {/* Current Responsible Organizations And Remove Section */}
        {project.responsibleOrganizations.length > 0 ? (
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {decideBetweenSingularOrPlural(
                locales.route.content.current.headline_one,
                locales.route.content.current.headline_other,
                project.responsibleOrganizations.length
              )}
            </h2>
            <Form
              {...getFormProps(removeResponsibleOrganizationForm)}
              method="post"
              preventScrollReset
            >
              <ListContainer
                locales={locales}
                listKey="responsible-organizations"
                hideAfter={3}
              >
                {project.responsibleOrganizations.map((relation, index) => {
                  return (
                    <ListItem
                      key={`responsible-organization-${relation.organization.slug}`}
                      entity={relation.organization}
                      locales={locales}
                      listIndex={index}
                      hideAfter={3}
                    >
                      <Button
                        name="intent"
                        variant="outline"
                        value={`remove-responsible-organization-${relation.organization.id}`}
                        type="submit"
                        fullSize
                      >
                        {locales.route.content.current.remove}
                      </Button>
                    </ListItem>
                  );
                })}
              </ListContainer>
              {typeof removeResponsibleOrganizationForm.errors !==
                "undefined" &&
              removeResponsibleOrganizationForm.errors.length > 0 ? (
                <div>
                  {removeResponsibleOrganizationForm.errors.map(
                    (error, index) => {
                      return (
                        <div
                          id={removeResponsibleOrganizationForm.errorId}
                          key={index}
                          className="mv-text-sm mv-font-semibold mv-text-negative-600"
                        >
                          {error}
                        </div>
                      );
                    }
                  )}
                </div>
              ) : null}
            </Form>
          </div>
        ) : null}
        {/* Own Organizations To Add Section */}
        {ownOrganizationSuggestions.length > 0 ? (
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {decideBetweenSingularOrPlural(
                locales.route.content.addOwn.headline_one,
                locales.route.content.addOwn.headline_other,
                ownOrganizationSuggestions.length
              )}
            </h2>
            <Form
              {...getFormProps(addOwnOrganizationForm)}
              method="post"
              preventScrollReset
            >
              <ListContainer
                locales={locales}
                listKey="own-organization-suggestions"
                hideAfter={3}
              >
                {ownOrganizationSuggestions.map((ownOrganization, index) => {
                  return (
                    <ListItem
                      key={`own-organization-${ownOrganization.slug}`}
                      entity={ownOrganization}
                      locales={locales}
                      listIndex={index}
                      hideAfter={3}
                    >
                      {project.responsibleOrganizations.some((relation) => {
                        return relation.organization.id === ownOrganization.id;
                      }) ? (
                        <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-positive-600 mv-text-sm mv-font-semibold mv-leading-5">
                          {locales.route.content.addOwn.alreadyResponsible}
                        </div>
                      ) : (
                        // TODO: Implement this when project responsible organization invites are implemented
                        // pendingResponsibleOrganizationInvites.some((relation) => {
                        //     return (
                        //       relation.organization.id === ownOrganization.id
                        //     );
                        //   }) ? (
                        //   <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-neutral-700 mv-text-sm mv-font-semibold mv-leading-5">
                        //     {
                        //       locales.route.content.addOwn
                        //         .alreadyInvited
                        //     }
                        //   </div>
                        // ) :
                        <Button
                          name="intent"
                          variant="outline"
                          value={`add-responsible-organization-${ownOrganization.id}`}
                          type="submit"
                          fullSize
                        >
                          {locales.route.content.addOwn.submit}
                        </Button>
                      )}
                    </ListItem>
                  );
                })}
              </ListContainer>
              {typeof addOwnOrganizationForm.errors !== "undefined" &&
              addOwnOrganizationForm.errors.length > 0 ? (
                <div>
                  {addOwnOrganizationForm.errors.map((error, index) => {
                    return (
                      <div
                        id={addOwnOrganizationForm.errorId}
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
        ) : null}
        {/* Search And Add Responsible Organization Section */}
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {locales.route.content.addOther.headline}
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
              {...getInputProps(searchFields[SearchOrganizations], {
                type: "search",
              })}
              key={searchFields[SearchOrganizations].id}
              standalone
            >
              <Input.Label htmlFor={searchFields[SearchOrganizations].id}>
                {locales.route.content.addOwn.search}
              </Input.Label>
              <Input.SearchIcon />

              {typeof searchFields[SearchOrganizations].errors !==
                "undefined" &&
              searchFields[SearchOrganizations].errors.length > 0 ? (
                searchFields[SearchOrganizations].errors.map((error) => (
                  <Input.Error
                    id={searchFields[SearchOrganizations].errorId}
                    key={error}
                  >
                    {error}
                  </Input.Error>
                ))
              ) : (
                <Input.HelperText>
                  {locales.route.content.addOwn.criteria}
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
                    {locales.route.content.addOwn.submitSearch}
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
          {searchedOrganizations.length > 0 ? (
            <Form
              {...getFormProps(addResponsibleOrganizationForm)}
              method="post"
              preventScrollReset
            >
              <ListContainer
                locales={locales}
                listKey="responsible-organization-search-results"
                hideAfter={3}
              >
                {searchedOrganizations.map((searchedOrganization, index) => {
                  return (
                    <ListItem
                      key={`responsible-organization-search-result-${searchedOrganization.slug}`}
                      entity={searchedOrganization}
                      locales={locales}
                      listIndex={index}
                      hideAfter={3}
                    >
                      {project.responsibleOrganizations.some((relation) => {
                        return (
                          relation.organization.id === searchedOrganization.id
                        );
                      }) ? (
                        <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-positive-600 mv-text-sm mv-font-semibold mv-leading-5">
                          {locales.route.content.addOther.alreadyResponsible}
                        </div>
                      ) : (
                        // TODO: Implement this when project responsible organization invites are implemented
                        // pendingResponsibleOrganizationInvites.some((relation) => {
                        //     return (
                        //       relation.organization.id === ownOrganization.id
                        //     );
                        //   }) ? (
                        //   <div className="mv-w-full mv-text-center mv-text-nowrap mv-text-neutral-700 mv-text-sm mv-font-semibold mv-leading-5">
                        //     {
                        //       locales.route.content.invite
                        //         .alreadyInvited
                        //     }
                        //   </div>
                        // ) :
                        <Button
                          name="intent"
                          variant="outline"
                          value={`add-responsible-organization-${searchedOrganization.id}`}
                          type="submit"
                          fullSize
                        >
                          {locales.route.content.addOther.add}
                        </Button>
                      )}
                    </ListItem>
                  );
                })}
              </ListContainer>
              {typeof addResponsibleOrganizationForm.errors !== "undefined" &&
              addResponsibleOrganizationForm.errors.length > 0 ? (
                <div>
                  {addResponsibleOrganizationForm.errors.map((error, index) => {
                    return (
                      <div
                        id={addResponsibleOrganizationForm.errorId}
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
