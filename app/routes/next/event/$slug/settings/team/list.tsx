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
  addContactPersonToEvent,
  getEventBySlug,
  getTeamMembersOfEvent,
  removeContactPersonFromEvent,
  removeTeamMemberFromEvent,
} from "./list.server";
import {
  ADD_CONTACT_PERSON_INTENT,
  CONFIRM_MODAL_SEARCH_PARAM,
  getAddContactPersonSchema,
  getRemoveContactPersonSchema,
  getRemoveTeamMemberSchema,
  getSearchTeamMembersSchema,
  REMOVE_CONTACT_PERSON_INTENT,
  REMOVE_TEAM_MEMBER_INTENT,
  SEARCH_TEAM_MEMBERS_SEARCH_PARAM,
  TEAM_MEMBER_ID,
} from "./list.shared";
import { INTENT_FIELD_NAME } from "~/form-helpers";

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

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(
    intent === REMOVE_TEAM_MEMBER_INTENT ||
      intent === ADD_CONTACT_PERSON_INTENT ||
      intent === REMOVE_CONTACT_PERSON_INTENT,
    "Invalid intent",
    { status: 400 }
  );

  if (intent === REMOVE_TEAM_MEMBER_INTENT) {
    if (event._count.teamMembers <= 1) {
      return redirectWithToast(request.url, {
        id: "remove-last-team-member-error",
        key: `remove-last-team-member-error-${Date.now()}`,
        message: locales.route.errors.removeLastTeamMember,
        level: "negative",
      });
    }

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
        locales: {
          mail: { subject: locales.route.mail.removeTeamMemberSubject },
        },
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
  } else if (intent === ADD_CONTACT_PERSON_INTENT) {
    const submission = await parseWithZod(formData, {
      schema: getAddContactPersonSchema(),
    });

    if (submission.status !== "success") {
      return submission.reply();
    }

    try {
      await addContactPersonToEvent({
        teamMemberId: submission.value.teamMemberId,
        eventId: event.id,
        locales: {
          mail: { subject: locales.route.mail.addContactPersonSubject },
        },
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "add-contact-person-error",
        key: `add-contact-person-error-${Date.now()}`,
        message: locales.route.errors.addContactPersonFailed,
        level: "negative",
      });
    }

    return redirectWithToast(request.url, {
      id: "add-contact-person-success",
      key: `add-contact-person-success-${Date.now()}`,
      message: locales.route.success.addContactPerson,
      level: "positive",
    });
  } else {
    const submission = await parseWithZod(formData, {
      schema: getRemoveContactPersonSchema(),
    });

    if (submission.status !== "success") {
      return submission.reply();
    }

    try {
      await removeContactPersonFromEvent({
        teamMemberId: submission.value.teamMemberId,
        eventId: event.id,
        locales: {
          mail: { subject: locales.route.mail.removeContactPersonSubject },
        },
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "remove-contact-person-error",
        key: `remove-contact-person-error-${Date.now()}`,
        message: locales.route.errors.removeContactPersonFailed,
        level: "negative",
      });
    }

    return redirectWithToast(request.url, {
      id: "remove-contact-person-success",
      key: `remove-contact-person-success-${Date.now()}`,
      message: locales.route.success.removeContactPerson,
      level: "positive",
    });
  }
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
      <List id="team-member-list" hideAfter={4} locales={locales.route.list}>
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
                  {teamMember.isContactPerson ? (
                    <Form
                      id={`remove-contact-person-form-${teamMember.id}`}
                      method="POST"
                      preventScrollReset
                    >
                      <input
                        type="hidden"
                        name={TEAM_MEMBER_ID}
                        value={teamMember.id}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        name={INTENT_FIELD_NAME}
                        value={REMOVE_CONTACT_PERSON_INTENT}
                      >
                        {locales.route.list.removeContactPerson}
                      </Button>
                    </Form>
                  ) : (
                    <Form
                      id={`add-contact-person-form-${teamMember.id}`}
                      method="POST"
                      preventScrollReset
                    >
                      <input
                        type="hidden"
                        name={TEAM_MEMBER_ID}
                        value={teamMember.id}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        name={INTENT_FIELD_NAME}
                        value={ADD_CONTACT_PERSON_INTENT}
                      >
                        {locales.route.list.addContactPerson}
                      </Button>
                    </Form>
                  )}
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
                        id={`remove-team-member-form-${teamMember.id}`}
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
                          form={`remove-team-member-form-${teamMember.id}`}
                          level="negative"
                          name={INTENT_FIELD_NAME}
                          value={REMOVE_TEAM_MEMBER_INTENT}
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
                      <Button
                        type="submit"
                        variant="outline"
                        name={INTENT_FIELD_NAME}
                        value={REMOVE_TEAM_MEMBER_INTENT}
                      >
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
