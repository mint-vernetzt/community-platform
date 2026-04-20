import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import { useEffect, useState } from "react";
import {
  Form,
  redirect,
  useFetcher,
  useLoaderData,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  addAdminAsTeamMemberToEvent,
  getAdminsOfEventToAddAsTeamMembers,
  getEventBySlug,
  inviteProfileToJoinEventAsTeamMember,
  searchProfiles,
} from "./add.server";
import {
  ADD_ADMIN_AS_TEAM_MEMBER_INTENT,
  createAddAdminAsTeamMemberSchema,
  createInviteProfileToJoinAsTeamMemberSchema,
  createSearchAdminsSchema,
  createSearchTeamMembersSchema,
  INVITE_PROFILE_TO_JOIN_AS_TEAM_MEMBER_INTENT,
  PROFILE_ID_FIELD,
  SEARCH_ADMINS_SEARCH_PARAM,
} from "./add.shared";
import { SEARCH_TEAM_MEMBERS_SEARCH_PARAM } from "./list.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/team/add"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "event not found", {
    status: 404,
  });

  const { authClient } = createAuthClient(request);
  const { result: searchedProfiles } = await searchProfiles({
    eventId: event.id,
    request,
    locales: locales.route.search,
    authClient,
  });

  const { result: admins, submission: adminsSearchSubmission } =
    await getAdminsOfEventToAddAsTeamMembers({
      eventId: event.id,
      request,
      locales: locales.route.team.search,
      authClient,
    });

  return {
    locales,
    searchedProfiles,
    admins,
    adminsSearchSubmission,
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);

  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/team/add"];

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(typeof intent === "string", "intent is not defined", {
    status: 400,
  });
  invariantResponse(
    intent === INVITE_PROFILE_TO_JOIN_AS_TEAM_MEMBER_INTENT ||
      intent === ADD_ADMIN_AS_TEAM_MEMBER_INTENT,
    "unknown intent",
    {
      status: 400,
    }
  );

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (intent === INVITE_PROFILE_TO_JOIN_AS_TEAM_MEMBER_INTENT) {
    const submission = await parseWithZod(formData, {
      schema: createInviteProfileToJoinAsTeamMemberSchema(),
    });

    if (submission.status !== "success") {
      return submission.reply();
    }

    try {
      await inviteProfileToJoinEventAsTeamMember({
        eventId: event.id,
        profileId: submission.value[PROFILE_ID_FIELD],
        locales: locales.route,
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "invite-profile-to-join-event-as-team-member-error",
        key: `invite-profile-to-join-event-as-team-member-error-${Date.now()}`,
        message: locales.route.errors.inviteProfileAsTeamMember,
        level: "negative",
      });
    }

    return redirectWithToast(request.url, {
      id: "invite-profile-to-join-event-as-team-member-success",
      key: `invite-profile-to-join-event-as-team-member-success-${Date.now()}`,
      message: locales.route.success.inviteProfileAsTeamMember,
      level: "positive",
    });
  } else {
    const submission = await parseWithZod(formData, {
      schema: createAddAdminAsTeamMemberSchema(),
    });

    if (submission.status !== "success") {
      return submission.reply();
    }

    try {
      await addAdminAsTeamMemberToEvent({
        eventId: event.id,
        profileId: submission.value[PROFILE_ID_FIELD],
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "add-admin-as-team-member-error",
        key: `add-admin-as-team-member-error-${Date.now()}`,
        message: locales.route.errors.addAdminAsTeamMember,
        level: "negative",
      });
    }

    return redirectWithToast(request.url, {
      id: "add-admin-as-team-member-success",
      key: `add-admin-as-team-member-success-${Date.now()}`,
      message: locales.route.success.addAdminAsTeamMember,
      level: "positive",
    });
  }
}

function AddTeamMember() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  const [searchParams] = useSearchParams();
  const searchTeamMembersParam = searchParams.get(
    SEARCH_TEAM_MEMBERS_SEARCH_PARAM
  );

  const searchFetcher = useFetcher<typeof loader>();
  const [searchForm, searchFields] = useForm({
    id: "search-team-members-form",
    defaultValue: {
      [SEARCH_TEAM_MEMBERS_SEARCH_PARAM]:
        searchTeamMembersParam !== null ? searchTeamMembersParam : "",
    },
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: createSearchTeamMembersSchema(locales.route.search),
      });
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
  });

  const handleChange = (event: React.ChangeEvent<HTMLFormElement>) => {
    searchForm.validate();
    if (searchForm.valid) {
      void searchFetcher.submit(event.currentTarget, {
        preventScrollReset: true,
      });
    }
  };

  const searchedProfiles =
    typeof searchFetcher.data !== "undefined"
      ? searchFetcher.data.searchedProfiles
      : loaderData.searchedProfiles;

  const [admins, setAdmins] = useState(loaderData.admins);

  useEffect(() => {
    setAdmins(loaderData.admins);
  }, [loaderData.admins]);

  return (
    <>
      <div>
        <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
          {locales.route.team.title}
        </h3>
        <p>{locales.route.team.instruction}</p>
      </div>
      <List locales={locales.route.search} id="team-member-list" hideAfter={1}>
        <List.Search
          defaultItems={loaderData.admins}
          setValues={setAdmins}
          searchParam={SEARCH_ADMINS_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.team.search.placeholder,
            label: locales.route.team.search.label,
          }}
          label={locales.route.team.search.label}
          submission={loaderData.adminsSearchSubmission}
          schema={createSearchAdminsSchema(locales.route.team.search)}
          hideLabel={false}
        />
        {admins.map((admin, index) => {
          return (
            <ListItemPersonOrg key={admin.id} index={index}>
              <ListItemPersonOrg.Avatar size="full" {...admin} />
              <ListItemPersonOrg.Headline>
                {admin.academicTitle !== null && admin.academicTitle.length > 0
                  ? `${admin.academicTitle} `
                  : ""}
                {admin.firstName} {admin.lastName}
              </ListItemPersonOrg.Headline>
              <ListItemPersonOrg.Controls>
                {admin.alreadyTeamMember ? (
                  <p className="text-sm font-semibold text-positive-600">
                    {locales.route.search.alreadyTeamMember}
                  </p>
                ) : admin.alreadyInvited ? (
                  <p className="text-sm font-semibold text-neutral-700">
                    {locales.route.search.alreadyInvited}
                  </p>
                ) : (
                  <Form
                    id={`add-admin-to-team-${admin.id}`}
                    method="post"
                    preventScrollReset
                  >
                    <Input
                      type="hidden"
                      name={PROFILE_ID_FIELD}
                      value={admin.id}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      name={INTENT_FIELD_NAME}
                      value={ADD_ADMIN_AS_TEAM_MEMBER_INTENT}
                    >
                      {locales.route.team.list.add}
                    </Button>
                  </Form>
                )}
              </ListItemPersonOrg.Controls>
            </ListItemPersonOrg>
          );
        })}
      </List>
      <div>
        <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
          {locales.route.search.title}
        </h3>
        <p>{locales.route.search.explanation}</p>
      </div>
      <searchFetcher.Form
        {...getFormProps(searchForm)}
        method="get"
        autoComplete="off"
        onChange={handleChange}
      >
        <Input name={Deep} defaultValue="true" type="hidden" />
        <Input
          {...getInputProps(searchFields[SEARCH_TEAM_MEMBERS_SEARCH_PARAM], {
            type: "text",
          })}
          placeholder={locales.route.search.placeholder}
          key={searchFields[SEARCH_TEAM_MEMBERS_SEARCH_PARAM].id}
          standalone
        >
          <Input.Label
            htmlFor={searchFields[SEARCH_TEAM_MEMBERS_SEARCH_PARAM].id}
          >
            {locales.route.search.label}
          </Input.Label>
          <Input.SearchIcon />
          <Input.ClearIcon
            onClick={() => {
              searchForm.reset();
              void searchFetcher.submit(null, { preventScrollReset: true });
            }}
          />

          {typeof searchFields[SEARCH_TEAM_MEMBERS_SEARCH_PARAM].errors !==
            "undefined" &&
          searchFields[SEARCH_TEAM_MEMBERS_SEARCH_PARAM].errors.length > 0 ? (
            searchFields[SEARCH_TEAM_MEMBERS_SEARCH_PARAM].errors.map(
              (error) => (
                <Input.Error
                  id={searchFields[SEARCH_TEAM_MEMBERS_SEARCH_PARAM].errorId}
                  key={error}
                >
                  {error}
                </Input.Error>
              )
            )
          ) : (
            <Input.HelperText>{locales.route.search.hint}</Input.HelperText>
          )}
          <Input.Controls>
            <noscript>
              <Button type="submit" variant="outline">
                {locales.route.search.submit}
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
                  className="text-sm font-semibold text-negative-700"
                >
                  {error}
                </div>
              );
            })}
          </div>
        ) : null}
      </searchFetcher.Form>
      {searchedProfiles.length > 0 && (
        <>
          <p className="text-sm text-neutral-700 font-semibold text-center">
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                locales.route.search.result_one,
                locales.route.search.result_other,
                searchedProfiles.length
              ),
              { count: searchedProfiles.length }
            )}
          </p>
          <List
            locales={locales.route.search}
            id="admin-search-results"
            hideAfter={4}
          >
            {searchedProfiles.map((searchedProfile, index) => {
              return (
                <ListItemPersonOrg key={searchedProfile.id} index={index}>
                  <ListItemPersonOrg.Avatar size="full" {...searchedProfile} />
                  <ListItemPersonOrg.Headline>
                    {searchedProfile.academicTitle !== null &&
                    searchedProfile.academicTitle.length > 0
                      ? `${searchedProfile.academicTitle} `
                      : ""}
                    {searchedProfile.firstName} {searchedProfile.lastName}
                  </ListItemPersonOrg.Headline>
                  <ListItemPersonOrg.Controls>
                    {searchedProfile.alreadyTeamMember ? (
                      <p className="text-sm font-semibold text-positive-600">
                        {locales.route.search.alreadyTeamMember}
                      </p>
                    ) : searchedProfile.alreadyInvited ? (
                      <p className="text-sm font-semibold text-neutral-700">
                        {locales.route.search.alreadyInvited}
                      </p>
                    ) : (
                      <Form
                        id={`invite-profile-to-join-event-as-team-member-${searchedProfile.id}`}
                        method="post"
                        preventScrollReset
                      >
                        <Input
                          type="hidden"
                          name={PROFILE_ID_FIELD}
                          value={searchedProfile.id}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          name={INTENT_FIELD_NAME}
                          value={INVITE_PROFILE_TO_JOIN_AS_TEAM_MEMBER_INTENT}
                        >
                          {locales.route.search.invite}
                        </Button>
                      </Form>
                    )}
                  </ListItemPersonOrg.Controls>
                </ListItemPersonOrg>
              );
            })}
          </List>
        </>
      )}
    </>
  );
}

export default AddTeamMember;
