import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import { useEffect, useState } from "react";
import {
  Form,
  redirect,
  useLoaderData,
  useLocation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { Modal } from "~/components-next/Modal";
import Hint from "~/components/next/Hint";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { detectLanguage } from "~/i18n.server";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  getEventBySlug,
  getTeamMembersOfEvent,
  removeTeamMemberFromEvent,
} from "./list.server";
import {
  CONFIRM_MODAL_SEARCH_PARAM,
  getRemoveTeamMemberSchema,
  getSearchTeamMembersSchema,
  SEARCH_TEAM_MEMBERS_SEARCH_PARAM,
  TEAM_MEMBER_ID,
} from "./list.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  invariantResponse(sessionUser !== null, "Unauthorized", { status: 401 }); // Needed for type narrowing

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/team/list"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { teamMembers, submission } = await getTeamMembersOfEvent({
    slug,
    authClient,
    searchParams,
  });

  return { locales, teamMembers, submission, userId: sessionUser.id };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;
  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/team/list"];

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event._count.teamMembers <= 1) {
    return redirectWithToast(request.url, {
      id: "remove-last-team-member-error",
      key: `remove-last-team-member-error-${Date.now()}`,
      message: locales.route.errors.removeLastTeamMember,
      level: "negative",
    });
  }

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: getRemoveTeamMemberSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await removeTeamMemberFromEvent({
      teamMemberId: submission.value.teamMemberId,
      eventId: event.id,
      locales: locales.route,
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "remove-team-member-error",
      key: `remove-team-member-error-${Date.now()}`,
      message: locales.route.errors.removeTeamMemberFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "remove-team-member-success",
    key: `remove-team-member-success-${Date.now()}`,
    message: locales.route.success.removeTeamMember,
    level: "positive",
  });
}

function TeamList() {
  const loaderData = useLoaderData<typeof loader>();

  const { locales } = loaderData;
  const [teamMembers, setTeamMembers] = useState(loaderData.teamMembers);

  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setTeamMembers(loaderData.teamMembers);
  }, [loaderData.teamMembers]);
  return (
    <>
      <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
        {locales.route.title}
      </h3>
      {loaderData.teamMembers.length <= 1 && (
        <Hint>
          {insertComponentsIntoLocale(locales.route.explanation, [
            <span key="strong" className="font-semibold" />,
          ])}
        </Hint>
      )}
      <List id="participants-list" hideAfter={4} locales={locales.route.list}>
        <List.Search
          defaultItems={loaderData.teamMembers}
          setValues={setTeamMembers}
          searchParam={SEARCH_TEAM_MEMBERS_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.list.searchPlaceholder,
          }}
          hideUntil={4}
          label={locales.route.list.searchPlaceholder}
          submission={loaderData.submission}
          schema={getSearchTeamMembersSchema()}
        />
        {teamMembers.map((teamMember, index) => {
          return (
            <ListItemPersonOrg
              key={teamMember.id}
              index={index}
              // to={`/profile/${teamMember.username}`} // TODO: link and controls currently not supported by component
            >
              <ListItemPersonOrg.Avatar size="full" {...teamMember} />
              <ListItemPersonOrg.Headline>
                {teamMember.academicTitle !== null &&
                teamMember.academicTitle.length > 0
                  ? `${teamMember.academicTitle} `
                  : ""}
                {teamMember.firstName} {teamMember.lastName}
              </ListItemPersonOrg.Headline>
              {loaderData.teamMembers.length > 1 && (
                <ListItemPersonOrg.Controls>
                  {loaderData.userId === teamMember.id ? (
                    <>
                      <Button
                        variant="outline"
                        as="link"
                        to={`?${extendSearchParams(searchParams, { addOrReplace: { [CONFIRM_MODAL_SEARCH_PARAM]: "true" } }).toString()}`}
                        preventScrollReset
                      >
                        {locales.route.list.remove}
                      </Button>
                      <Form
                        id={`remove-admin-form-${teamMember.id}`}
                        method="POST"
                        preventScrollReset
                        hidden
                      >
                        <input
                          name={TEAM_MEMBER_ID}
                          defaultValue={teamMember.id}
                        />
                      </Form>
                      <Modal searchParam={CONFIRM_MODAL_SEARCH_PARAM}>
                        <Modal.Title>
                          {locales.route.confirmation.title}
                        </Modal.Title>
                        <Modal.Section>
                          {locales.route.confirmation.description}
                        </Modal.Section>
                        <Modal.SubmitButton
                          form={`remove-admin-form-${teamMember.id}`}
                          level="negative"
                        >
                          {locales.route.confirmation.confirm}
                        </Modal.SubmitButton>
                        <Modal.CloseButton route={location.pathname}>
                          {locales.route.confirmation.abort}
                        </Modal.CloseButton>
                      </Modal>
                    </>
                  ) : (
                    <Form
                      id={`remove-admin-form-${teamMember.id}`}
                      method="POST"
                      preventScrollReset
                    >
                      <input
                        type="hidden"
                        name={TEAM_MEMBER_ID}
                        value={teamMember.id}
                      />
                      <Button type="submit" variant="outline">
                        {locales.route.list.remove}
                      </Button>
                    </Form>
                  )}
                </ListItemPersonOrg.Controls>
              )}
            </ListItemPersonOrg>
          );
        })}
      </List>
    </>
  );
}

export default TeamList;
