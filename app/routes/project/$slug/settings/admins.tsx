import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  useSubmit,
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
  addAdminToProject,
  getProjectWithAdmins,
  removeAdminFromProject,
} from "./admins.server";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/settings/admins"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = deriveMode(sessionUser);

  const project = await getProjectWithAdmins({
    slug,
    authClient,
    locales,
  });

  // TODO: Implement this when project admin invites are implemented
  // const pendingAdminInvites = await getPendingAdminInvitesOfProject(
  //   project.id,
  //   authClient
  // );

  const pendingAndCurrentAdminIds = [
    ...project.admins.map((relation) => relation.profile.id),
    // ...pendingAdminInvites.map((invite) => invite.id),
  ];
  const { searchedProfiles, submission } = await searchProfiles({
    searchParams: new URL(request.url).searchParams,
    idsToExclude: pendingAndCurrentAdminIds,
    authClient,
    locales,
    mode,
  });

  return {
    project,
    // pendingAdminInvites,
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
  const locales = languageModuleMap[language]["project/$slug/settings/admins"];

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
  // TODO: Remove this when project admin invites are implemented
  if (intent.startsWith("add-admin-")) {
    const addAdminFormData = new FormData();
    addAdminFormData.set("profileId", intent.replace("add-admin-", ""));
    result = await addAdminToProject({
      formData: addAdminFormData,
      slug,
      locales,
    });
  }
  // TODO: Implement this when project admin invites are implemented
  // else if (intent.startsWith("invite-admin-")) {
  //   const inviteFormData = new FormData();
  //   inviteFormData.set("profileId", intent.replace("invite-admin-", ""));
  //   result = await inviteProfileToBeProjectAdmin({
  //     formData: inviteFormData,
  //     slug,
  //     locales,
  //   });
  // } else if (intent.startsWith("cancel-admin-invite-")) {
  //   const cancelAdminInviteFormData = new FormData();
  //   cancelAdminInviteFormData.set(
  //     "profileId",
  //     intent.replace("cancel-admin-invite-", "")
  //   );
  //   result = await cancelProjectAdminInvitation({
  //     formData: cancelAdminInviteFormData,
  //     slug,
  //     locales,
  //   });
  // }
  else if (intent.startsWith("remove-admin-")) {
    const removeAdminFormData = new FormData();
    removeAdminFormData.set("profileId", intent.replace("remove-admin-", ""));
    result = await removeAdminFromProject({
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
  return { submission: result.submission, currentTimestamp: Date.now() };
};

function Admins() {
  const {
    project,
    // pendingAdminInvites,
    searchedProfiles,
    submission: loaderSubmission,
    locales,
    currentTimestamp,
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

  // TODO: Remove this when project admin invites are implemented
  const [addAdminForm] = useForm({
    id: `add-admins-${actionData?.currentTimestamp || currentTimestamp}`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  // TODO: Implement this when project admin invites are implemented
  // const [inviteAdminForm] = useForm({
  //   id: `invite-admins-${actionData?.currentTimestamp || currentTimestamp}`,
  //   lastResult: navigation.state === "idle" ? actionData?.submission : null,
  // });

  // const [cancelAdminInviteForm] = useForm({
  //   id: `cancel-admin-invites-${
  //     actionData?.currentTimestamp || currentTimestamp
  //   }`,
  //   lastResult: navigation.state === "idle" ? actionData?.submission : null,
  // });

  const [removeAdminForm] = useForm({
    id: `remove-admins-${actionData?.currentTimestamp || currentTimestamp}`,
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
              project.admins.length
            )}
          </h2>
          <Form
            {...getFormProps(removeAdminForm)}
            method="post"
            preventScrollReset
          >
            <ListContainer locales={locales} listKey="admins" hideAfter={3}>
              {project.admins.map((relation, index) => {
                return (
                  <ListItem
                    key={`admin-${relation.profile.username}`}
                    entity={relation.profile}
                    locales={locales}
                    listIndex={index}
                    hideAfter={3}
                  >
                    {project.admins.length > 1 && (
                      <Button
                        name="intent"
                        variant="outline"
                        value={`remove-admin-${relation.profile.id}`}
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
            {typeof removeAdminForm.errors !== "undefined" &&
            removeAdminForm.errors.length > 0 ? (
              <div>
                {removeAdminForm.errors.map((error, index) => {
                  return (
                    <div
                      id={removeAdminForm.errorId}
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
        {/* TODO: Remove this when project admin invites are implemented */}
        {/* Add Admins Section */}
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
              {...getFormProps(addAdminForm)}
              method="post"
              preventScrollReset
            >
              <ListContainer
                locales={locales}
                listKey="admin-search-results"
                hideAfter={3}
              >
                {searchedProfiles.map((profile, index) => {
                  return (
                    <ListItem
                      key={`admin-search-result-${profile.username}`}
                      entity={profile}
                      locales={locales}
                      listIndex={index}
                      hideAfter={3}
                    >
                      <Button
                        name="intent"
                        variant="outline"
                        value={`add-admin-${profile.id}`}
                        type="submit"
                        fullSize
                      >
                        {locales.route.content.add.submit}
                      </Button>
                    </ListItem>
                  );
                })}
              </ListContainer>
              {typeof addAdminForm.errors !== "undefined" &&
              addAdminForm.errors.length > 0 ? (
                <div>
                  {addAdminForm.errors.map((error, index) => {
                    return (
                      <div
                        id={addAdminForm.errorId}
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
          {/* TODO: Implement this when project admin invites are implemented */}
          {/* Search Profiles To Invite Section
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
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
              {...getFormProps(addAdminForm)}
              method="post"
              preventScrollReset
            >
              <ListContainer
                locales={locales}
                listKey="admin-search-results"
                hideAfter={3}
              >
                {searchedProfiles.map((profile, index) => {
                  return (
                    <ListItem
                      key={`admin-search-result-${profile.username}`}
                      entity={profile}
                      locales={locales}
                      listIndex={index}
                      hideAfter={3}
                    >
                      <Button
                        name="intent"
                        variant="outline"
                        value={`invite-admin-${profile.id}`}
                        type="submit"
                        fullSize
                      >
                        {locales.route.content.invite.submit}
                      </Button>
                    </ListItem>
                  );
                })}
              </ListContainer>
              {typeof addAdminForm.errors !== "undefined" &&
              addAdminForm.errors.length > 0 ? (
                <div>
                  {addAdminForm.errors.map((error, index) => {
                    return (
                      <div
                        id={addAdminForm.errorId}
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
          {/* {pendingAdminInvites.length > 0 ? (
            <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
              <h4 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
                {locales.route.content.invites.headline}
              </h4>
              <p>{locales.route.content.invites.intro} </p>
              <Form
                {...getFormProps(cancelAdminInviteForm)}
                method="post"
                preventScrollReset
              >
                <ListContainer
                  locales={locales}
                  listKey="pending-admin-invites"
                  hideAfter={3}
                >
                  {pendingAdminInvites.map((profile, index) => {
                    return (
                      <ListItem
                        key={`pending-admin-invite-${profile.username}`}
                        entity={profile}
                        locales={locales}
                        listIndex={index}
                        hideAfter={3}
                      >
                        <Button
                          name="intent"
                          variant="outline"
                          value={`cancel-admin-invite-${profile.id}`}
                          type="submit"
                          fullSize
                        >
                          {locales.route.content.invites.cancel}
                        </Button>
                      </ListItem>
                    );
                  })}
                </ListContainer>
                {typeof cancelAdminInviteForm.errors !== "undefined" &&
                cancelAdminInviteForm.errors.length > 0 ? (
                  <div>
                    {cancelAdminInviteForm.errors.map((error, index) => {
                      return (
                        <div
                          id={cancelAdminInviteForm.errorId}
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

export default Admins;
