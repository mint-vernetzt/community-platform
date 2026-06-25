import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { captureException } from "@sentry/node";
import { useEffect, useState } from "react";
import {
  type ActionFunctionArgs,
  Form,
  Link,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useSearchParams,
} from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import { EventListItem } from "~/components-next/EventListItem";
import { Add } from "~/components-next/icons/Add";
import { ListContainer } from "~/components-next/ListContainer";
import { Container } from "~/components-next/MyEventsOrganizationDetailContainer";
import { Section } from "~/components-next/MyEventsProjectsSection";
import { Placeholder } from "~/components-next/Placeholder";
import { TabBarTitle } from "~/components-next/TabBarTitle";
import { RichText } from "~/components/legacy/Richtext/RichText";
import List from "~/components/next/List";
import ListItemEvent from "~/components/next/ListItemEvent";
import { hasDescription, hasSubline } from "~/events.utils.shared";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { redirectWithToast } from "~/toast.server";
import { getFeatureAbilities } from "../feature-access.server";
import {
  acceptInviteAsAdmin,
  acceptInviteAsParticipant,
  acceptInviteAsResponsibleOrganization,
  acceptInviteAsSpeaker,
  acceptInviteAsTeamMember,
  getEventInvites,
  getEventsWithPendingRequests,
  getEvents,
  rejectInviteAsAdmin,
  rejectInviteAsParticipant,
  rejectInviteAsResponsibleOrganization,
  rejectInviteAsSpeaker,
  rejectInviteAsTeamMember,
  acceptRequestAsParentEvent,
  rejectRequestAsParentEvent,
} from "./events.server";
import {
  ACCEPT_ADMIN_INVITE_INTENT,
  ACCEPT_PARENT_EVENT_JOIN_REQUEST_INTENT,
  ACCEPT_PARTICIPANT_INVITE_INTENT,
  ACCEPT_RESPONSIBLE_ORGANIZATION_INVITE_INTENT,
  ACCEPT_SPEAKER_INVITE_INTENT,
  ACCEPT_TEAM_MEMBER_INVITE_INTENT,
  CHILD_EVENT_ID,
  createAcceptOrRejectInviteOrRequestSchema,
  EVENT_ID,
  ORGANIZATION_ID,
  REJECT_ADMIN_INVITE_INTENT,
  REJECT_PARENT_EVENT_JOIN_REQUEST_INTENT,
  REJECT_PARTICIPANT_INVITE_INTENT,
  REJECT_RESPONSIBLE_ORGANIZATION_INVITE_INTENT,
  REJECT_SPEAKER_INVITE_INTENT,
  REJECT_TEAM_MEMBER_INVITE_INTENT,
} from "./events.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["events"]);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["my/events"];

  const upcomingEvents = await getEvents({
    profileId: sessionUser.id,
    authClient,
  });
  const pastEvents = await getEvents({
    profileId: sessionUser.id,
    authClient,
    where: { endTime: { lt: new Date() } },
    orderBy: { endTime: "desc" },
  });
  const canceledEvents = upcomingEvents.participantEvents.filter((event) => {
    return event.canceled;
  });

  const featureAbilities = await getFeatureAbilities(authClient, ["events"]);

  const invites = await getEventInvites({
    profileId: sessionUser.id,
    authClient,
  });
  if (featureAbilities["events"].hasAccess === false) {
    invites.adminInvites = [];
    invites.count.adminInvites = 0;
  }

  const eventsWithPendingRequests = await getEventsWithPendingRequests(
    sessionUser.id,
    authClient
  );

  return {
    upcomingEvents,
    pastEvents,
    canceledEvents,
    invites,
    eventsWithPendingRequests,
    abilities,
    locales,
    language,
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUserOrThrow(authClient);
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["my/events"];

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(typeof intent === "string", "intent is not defined", {
    status: 400,
  });
  invariantResponse(
    intent === ACCEPT_ADMIN_INVITE_INTENT ||
      intent === REJECT_ADMIN_INVITE_INTENT ||
      intent === ACCEPT_TEAM_MEMBER_INVITE_INTENT ||
      intent === REJECT_TEAM_MEMBER_INVITE_INTENT ||
      intent === ACCEPT_SPEAKER_INVITE_INTENT ||
      intent === REJECT_SPEAKER_INVITE_INTENT ||
      intent === ACCEPT_PARTICIPANT_INVITE_INTENT ||
      intent === REJECT_PARTICIPANT_INVITE_INTENT ||
      intent === ACCEPT_RESPONSIBLE_ORGANIZATION_INVITE_INTENT ||
      intent === REJECT_RESPONSIBLE_ORGANIZATION_INVITE_INTENT ||
      intent === ACCEPT_PARENT_EVENT_JOIN_REQUEST_INTENT ||
      intent === REJECT_PARENT_EVENT_JOIN_REQUEST_INTENT,
    "invalid intent",
    { status: 400 }
  );
  const submission = await parseWithZod(formData, {
    schema: createAcceptOrRejectInviteOrRequestSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  let toastMessage = "";

  if (intent === ACCEPT_ADMIN_INVITE_INTENT) {
    try {
      await acceptInviteAsAdmin({
        userId: sessionUser.id,
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.inviteAsAdminAccepted,
        },
      });
      toastMessage = locales.route.success.acceptInviteAsAdmin;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "accept-admin-invite-error",
        key: `accept-admin-invite-error-${Date.now()}`,
        message: locales.route.errors.acceptInviteAsAdmin,
        level: "negative",
      });
    }
  } else if (intent === REJECT_ADMIN_INVITE_INTENT) {
    try {
      await rejectInviteAsAdmin({
        userId: sessionUser.id,
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.inviteAsAdminRejected,
        },
      });
      toastMessage = locales.route.success.rejectInviteAsAdmin;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "reject-admin-invite-error",
        key: `reject-admin-invite-error-${Date.now()}`,
        message: locales.route.errors.rejectInviteAsAdmin,
        level: "negative",
      });
    }
  } else if (intent === ACCEPT_TEAM_MEMBER_INVITE_INTENT) {
    try {
      await acceptInviteAsTeamMember({
        userId: sessionUser.id,
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.inviteAsTeamMemberAccepted,
        },
      });
      toastMessage = locales.route.success.acceptInviteAsTeamMember;
    } catch (error) {
      console.log(error);
      captureException(error);
      return redirectWithToast(request.url, {
        id: "accept-team-member-invite-error",
        key: `accept-team-member-invite-error-${Date.now()}`,
        message: locales.route.errors.acceptInviteAsTeamMember,
        level: "negative",
      });
    }
  } else if (intent === REJECT_TEAM_MEMBER_INVITE_INTENT) {
    try {
      await rejectInviteAsTeamMember({
        userId: sessionUser.id,
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.inviteAsTeamMemberRejected,
        },
      });
      toastMessage = locales.route.success.rejectInviteAsTeamMember;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "reject-team-member-invite-error",
        key: `reject-team-member-invite-error-${Date.now()}`,
        message: locales.route.errors.rejectInviteAsTeamMember,
        level: "negative",
      });
    }
  } else if (intent === ACCEPT_SPEAKER_INVITE_INTENT) {
    try {
      await acceptInviteAsSpeaker({
        userId: sessionUser.id,
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.inviteAsSpeakerAccepted,
        },
      });
      toastMessage = locales.route.success.acceptInviteAsSpeaker;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "accept-speaker-invite-error",
        key: `accept-speaker-invite-error-${Date.now()}`,
        message: locales.route.errors.acceptInviteAsSpeaker,
        level: "negative",
      });
    }
  } else if (intent === REJECT_SPEAKER_INVITE_INTENT) {
    try {
      await rejectInviteAsSpeaker({
        userId: sessionUser.id,
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.inviteAsSpeakerRejected,
        },
      });
      toastMessage = locales.route.success.rejectInviteAsSpeaker;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "reject-speaker-invite-error",
        key: `reject-speaker-invite-error-${Date.now()}`,
        message: locales.route.errors.rejectInviteAsSpeaker,
        level: "negative",
      });
    }
  } else if (intent === ACCEPT_PARTICIPANT_INVITE_INTENT) {
    try {
      await acceptInviteAsParticipant({
        userId: sessionUser.id,
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.inviteAsParticipantAccepted,
        },
      });
      toastMessage = locales.route.success.acceptInviteAsParticipant;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "accept-participant-invite-error",
        key: `accept-participant-invite-error-${Date.now()}`,
        message: locales.route.errors.acceptInviteAsParticipant,
        level: "negative",
      });
    }
  } else if (intent === REJECT_PARTICIPANT_INVITE_INTENT) {
    try {
      await rejectInviteAsParticipant({
        userId: sessionUser.id,
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.inviteAsParticipantRejected,
        },
      });
      toastMessage = locales.route.success.rejectInviteAsParticipant;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "reject-participant-invite-error",
        key: `reject-participant-invite-error-${Date.now()}`,
        message: locales.route.errors.rejectInviteAsParticipant,
        level: "negative",
      });
    }
  } else if (
    intent === ACCEPT_RESPONSIBLE_ORGANIZATION_INVITE_INTENT &&
    typeof submission.value[ORGANIZATION_ID] !== "undefined"
  ) {
    try {
      await acceptInviteAsResponsibleOrganization({
        userId: sessionUser.id,
        organizationId: submission.value[ORGANIZATION_ID],
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.inviteAsResponsibleOrganizationAccepted,
        },
      });
      toastMessage =
        locales.route.success.acceptInviteAsResponsibleOrganization;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "accept-responsible-organization-invite-error",
        key: `accept-responsible-organization-invite-error-${Date.now()}`,
        message: locales.route.errors.acceptInviteAsResponsibleOrganization,
        level: "negative",
      });
    }
  } else if (
    intent === REJECT_RESPONSIBLE_ORGANIZATION_INVITE_INTENT &&
    typeof submission.value[ORGANIZATION_ID] !== "undefined"
  ) {
    try {
      await rejectInviteAsResponsibleOrganization({
        userId: sessionUser.id,
        organizationId: submission.value[ORGANIZATION_ID],
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.inviteAsResponsibleOrganizationRejected,
        },
      });
      toastMessage =
        locales.route.success.rejectInviteAsResponsibleOrganization;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "reject-responsible-organization-invite-error",
        key: `reject-responsible-organization-invite-error-${Date.now()}`,
        message: locales.route.errors.rejectInviteAsResponsibleOrganization,
        level: "negative",
      });
    }
  } else if (
    intent === ACCEPT_PARENT_EVENT_JOIN_REQUEST_INTENT &&
    typeof submission.value[CHILD_EVENT_ID] !== "undefined"
  ) {
    try {
      await acceptRequestAsParentEvent({
        userId: sessionUser.id,
        childEventId: submission.value[CHILD_EVENT_ID],
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.requestAsParentEventAccepted,
        },
      });
      toastMessage = locales.route.success.acceptRequestAsParentEvent;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "accept-parent-event-join-request-error",
        key: `accept-parent-event-join-request-error-${Date.now()}`,
        message: locales.route.errors.acceptRequestAsParentEvent,
        level: "negative",
      });
    }
  } else if (
    intent === REJECT_PARENT_EVENT_JOIN_REQUEST_INTENT &&
    typeof submission.value[CHILD_EVENT_ID] !== "undefined"
  ) {
    try {
      await rejectRequestAsParentEvent({
        userId: sessionUser.id,
        childEventId: submission.value[CHILD_EVENT_ID],
        eventId: submission.value[EVENT_ID],
        locales: {
          mail: locales.route.mail.requestAsParentEventRejected,
        },
      });
      toastMessage = locales.route.success.rejectRequestAsParentEvent;
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "reject-parent-event-join-request-error",
        key: `reject-parent-event-join-request-error-${Date.now()}`,
        message: locales.route.errors.rejectRequestAsParentEvent,
        level: "negative",
      });
    }
  }

  return redirectWithToast(request.url, {
    id: "invite-success",
    key: `invite-success-${Date.now()}`,
    message: toastMessage,
    level: "positive",
  });
}

function MyEvents() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;

  const firstUpcoming = Object.entries(loaderData.upcomingEvents.count).find(
    ([_key, value]) => {
      return value > 0;
    }
  ) || ["adminEvents", 0];
  const firstPast = Object.entries(loaderData.pastEvents.count).find(
    ([_key, value]) => {
      return value > 0;
    }
  ) || ["adminEvents", 0];

  const firstInvites = Object.entries(loaderData.invites.count).find(
    ([_key, value]) => {
      return value > 0;
    }
  ) || ["adminInvites", 0];

  const firstRequests =
    loaderData.eventsWithPendingRequests.length > 0
      ? loaderData.eventsWithPendingRequests[0].slug
      : "";

  const [searchParams, setSearchParams] = useSearchParams({
    upcoming: firstUpcoming[0],
    past: firstPast[0],
    invites: firstInvites[0],
  });
  const [upcoming, setUpcoming] = useState(
    searchParams.has("upcoming")
      ? (searchParams.get("upcoming") as string)
      : firstUpcoming[0]
  );
  const [past, setPast] = useState(
    searchParams.has("past")
      ? (searchParams.get("past") as string)
      : firstPast[0]
  );
  const [invites, setInvites] = useState(
    searchParams.has("invites")
      ? (searchParams.get("invites") as string)
      : firstInvites[0]
  );
  const [requests, setRequests] = useState(
    searchParams.has("requests")
      ? (searchParams.get("requests") as string)
      : firstRequests[0]
  );

  // TODO: Clean up this client side state management. Action redirect can return the correct search params for the next tabs to be opened. Then the Toast won't be interrupted by another server side request (setSearchParams) after the action. Currently a delay of 5 seconds acts as a workarround to still display the toast.
  useEffect(() => {
    if (searchParams.has("toast-trigger")) {
      const firstUpcoming = Object.entries(
        loaderData.upcomingEvents.count
      ).find(([_key, value]) => {
        return value > 0;
      }) || ["adminEvents", 0];
      const firstPast = Object.entries(loaderData.pastEvents.count).find(
        ([_key, value]) => {
          return value > 0;
        }
      ) || ["adminEvents", 0];

      const firstInvites = Object.entries(loaderData.invites.count).find(
        ([_key, value]) => {
          return value > 0;
        }
      ) || ["adminInvites", 0];

      const firstRequests =
        loaderData.eventsWithPendingRequests.length > 0
          ? loaderData.eventsWithPendingRequests[0].slug
          : "";
      setUpcoming(firstUpcoming[0]);
      setPast(firstPast[0]);
      setInvites(firstInvites[0]);
      setRequests(firstRequests);
    }
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("upcoming", upcoming);
    params.delete("toast-trigger");
    const timeout = setTimeout(() => {
      setSearchParams(params, { preventScrollReset: true, replace: true });
    }, 5000);
    return () => clearTimeout(timeout);
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcoming]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("past", past);
    params.delete("toast-trigger");
    const timeout = setTimeout(() => {
      setSearchParams(params, { preventScrollReset: true, replace: true });
    }, 5000);
    return () => clearTimeout(timeout);
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [past]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("invites", invites);
    params.delete("toast-trigger");
    const timeout = setTimeout(() => {
      setSearchParams(params, { preventScrollReset: true, replace: true });
    }, 5000);
    return () => clearTimeout(timeout);
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invites]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("requests", requests);
    params.delete("toast-trigger");
    const timeout = setTimeout(() => {
      setSearchParams(params, { preventScrollReset: true, replace: true });
    }, 5000);
    return () => clearTimeout(timeout);
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  const upcomingEventsCount = Object.values(
    loaderData.upcomingEvents.count
  ).reduce((previousValue, currentValue) => {
    return previousValue + currentValue;
  }, 0);
  const hasUpcomingEvents = upcomingEventsCount > 0;

  const pastEventsCount = Object.values(loaderData.pastEvents.count).reduce(
    (previousValue, currentValue) => {
      return previousValue + currentValue;
    },
    0
  );

  const hasPastEvents = pastEventsCount > 0;
  const hasCanceledEvents = loaderData.canceledEvents.length > 0;
  const hasAdminInvites = loaderData.invites.count.adminInvites > 0;
  const hasTeamMemberInvites = loaderData.invites.count.teamMemberInvites > 0;
  const hasSpeakerInvites = loaderData.invites.count.speakerInvites > 0;
  const hasParticipantInvites = loaderData.invites.count.participantInvites > 0;
  const hasResponsibleOrganizationInvites =
    loaderData.invites.count.responsibleOrganizationInvites > 0;

  return (
    <Container>
      <Container.Header>
        <Container.Title>{locales.route.title}</Container.Title>
        {loaderData.abilities["events"].hasAccess ? (
          <Button as="link" to="/event/create" prefetch="intent">
            <Add />
            {locales.route.create}
          </Button>
        ) : null}
      </Container.Header>
      {(hasAdminInvites ||
        hasTeamMemberInvites ||
        hasSpeakerInvites ||
        hasParticipantInvites ||
        hasResponsibleOrganizationInvites) && (
        <Container.Section>
          <Section.Title>{locales.route.invites.title}</Section.Title>
          <Section.Text>{locales.route.invites.description}</Section.Text>
          <Section.TabBar>
            {Object.entries(loaderData.invites.count).map(([key, value]) => {
              if (value === 0) {
                return null;
              }
              const typedKey = key as keyof typeof loaderData.invites.count;

              const searchParamsCopy = new URLSearchParams(searchParams);
              searchParamsCopy.set("invites", key);

              return (
                <TabBar.Item key={`invites-${key}`} active={invites === key}>
                  <Link
                    to={`./?${searchParamsCopy.toString()}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setInvites(key);
                    }}
                    preventScrollReset
                  >
                    <TabBarTitle>
                      {(() => {
                        let title;
                        if (key in locales.route.tabBar) {
                          type LocaleKey = keyof typeof locales.route.tabBar;
                          title = locales.route.tabBar[key as LocaleKey];
                        } else {
                          console.error(
                            `Tab bar title ${key} not found in locales`
                          );
                          title = key;
                        }
                        return title;
                      })()}
                      <TabBar.Counter active={invites === key}>
                        {loaderData.invites.count[typedKey]}
                      </TabBar.Counter>
                    </TabBarTitle>
                  </Link>
                </TabBar.Item>
              );
            })}
          </Section.TabBar>
          <List id="invites" hideAfter={3} locales={locales.route.list}>
            {loaderData.invites[invites as "adminInvites"].map(
              (invite, index) => {
                const { event, organizationId } = invite;
                let acceptIntent = ACCEPT_ADMIN_INVITE_INTENT;
                if (invites === "teamMemberInvites") {
                  acceptIntent = ACCEPT_TEAM_MEMBER_INVITE_INTENT;
                } else if (invites === "speakerInvites") {
                  acceptIntent = ACCEPT_SPEAKER_INVITE_INTENT;
                } else if (invites === "responsibleOrganizationInvites") {
                  acceptIntent = ACCEPT_RESPONSIBLE_ORGANIZATION_INVITE_INTENT;
                } else if (invites === "participantInvites") {
                  acceptIntent = ACCEPT_PARTICIPANT_INVITE_INTENT;
                }

                let rejectIntent = REJECT_ADMIN_INVITE_INTENT;
                if (invites === "teamMemberInvites") {
                  rejectIntent = REJECT_TEAM_MEMBER_INVITE_INTENT;
                } else if (invites === "speakerInvites") {
                  rejectIntent = REJECT_SPEAKER_INVITE_INTENT;
                } else if (invites === "responsibleOrganizationInvites") {
                  rejectIntent = REJECT_RESPONSIBLE_ORGANIZATION_INVITE_INTENT;
                } else if (invites === "participantInvites") {
                  rejectIntent = REJECT_PARTICIPANT_INVITE_INTENT;
                }

                return (
                  <ListItemEvent
                    key={`${invites}-${event.slug}`}
                    to={`/event/${event.slug}/detail/about`}
                    index={index}
                  >
                    <ListItemEvent.Image
                      src={event.background}
                      blurredSrc={event.blurredBackground}
                      alt={event.name}
                    />
                    <ListItemEvent.Info
                      {...event}
                      stage={event.stage}
                      locales={{
                        stages: loaderData.locales.stages,
                        ...loaderData.locales.route.list,
                      }}
                      language={loaderData.language}
                    ></ListItemEvent.Info>
                    <ListItemEvent.Headline>
                      {event.name}
                    </ListItemEvent.Headline>
                    {hasSubline(event) || hasDescription(event) ? (
                      <ListItemEvent.Subline>
                        {hasSubline(event) ? (
                          event.subline
                        ) : (
                          <RichText html={event.description as string} />
                        )}
                      </ListItemEvent.Subline>
                    ) : null}
                    <ListItemEvent.Controls>
                      <Form
                        id={`reject-${invites}-form-${event.id}`}
                        method="POST"
                        preventScrollReset
                      >
                        <input type="hidden" name={EVENT_ID} value={event.id} />
                        {typeof organizationId !== "undefined" && (
                          <input
                            type="hidden"
                            name={ORGANIZATION_ID}
                            value={organizationId}
                          />
                        )}
                        <Button
                          type="submit"
                          size="small"
                          fullSize
                          variant="outline"
                          name={INTENT_FIELD_NAME}
                          value={rejectIntent}
                          onClick={(
                            event: React.MouseEvent<HTMLButtonElement>
                          ) => {
                            event.stopPropagation();
                          }}
                        >
                          {locales.route.list.reject.invite}
                        </Button>
                      </Form>
                      <Form
                        id={`accept-${invites}-form-${event.id}`}
                        method="POST"
                        preventScrollReset
                      >
                        <input type="hidden" name={EVENT_ID} value={event.id} />
                        {typeof organizationId !== "undefined" && (
                          <input
                            type="hidden"
                            name={ORGANIZATION_ID}
                            value={organizationId}
                          />
                        )}
                        <Button
                          type="submit"
                          size="small"
                          fullSize
                          name={INTENT_FIELD_NAME}
                          value={acceptIntent}
                          onClick={(
                            event: React.MouseEvent<HTMLButtonElement>
                          ) => {
                            event.stopPropagation();
                          }}
                        >
                          {locales.route.list.accept.invite}
                        </Button>
                      </Form>
                    </ListItemEvent.Controls>
                  </ListItemEvent>
                );
              }
            )}
          </List>
        </Container.Section>
      )}
      {loaderData.eventsWithPendingRequests.length > 0 && (
        <Container.Section>
          <Section.Title>{locales.route.requests.title}</Section.Title>
          <Section.Text>{locales.route.requests.description}</Section.Text>
          <Section.TabBar>
            {loaderData.eventsWithPendingRequests.map((event) => {
              if (event.receivedParentEventJoinRequests.length === 0) {
                return null;
              }

              const searchParamsCopy = new URLSearchParams(searchParams);
              searchParamsCopy.set("requests", event.slug);

              return (
                <TabBar.Item
                  key={`requests-${event.slug}`}
                  active={requests === event.slug}
                >
                  <Link
                    to={`./?${searchParamsCopy.toString()}`}
                    onClick={(clickEvent) => {
                      clickEvent.preventDefault();
                      setRequests(event.slug);
                    }}
                    preventScrollReset
                  >
                    <TabBarTitle>
                      {event.name}
                      <TabBar.Counter active={requests === event.slug}>
                        {event.receivedParentEventJoinRequests.length}
                      </TabBar.Counter>
                    </TabBarTitle>
                  </Link>
                </TabBar.Item>
              );
            })}
          </Section.TabBar>
          <List id="requests" hideAfter={3} locales={locales.route.list}>
            {loaderData.eventsWithPendingRequests
              .find((event) => event.slug === requests)
              ?.receivedParentEventJoinRequests.map((event, index) => {
                return (
                  <ListItemEvent
                    key={`${requests}-${event.childEvent.slug}`}
                    to={`/event/${event.childEvent.slug}/detail/about`}
                    index={index}
                  >
                    <ListItemEvent.Image
                      src={event.childEvent.background}
                      blurredSrc={event.childEvent.blurredBackground}
                      alt={event.childEvent.name}
                    />
                    <ListItemEvent.Info
                      {...event.childEvent}
                      participantCount={event.childEvent._count.participants}
                      stage={event.childEvent.stage}
                      locales={{
                        stages: loaderData.locales.stages,
                        ...loaderData.locales.route.list,
                      }}
                      language={loaderData.language}
                    ></ListItemEvent.Info>
                    <ListItemEvent.Headline>
                      {event.childEvent.name}
                    </ListItemEvent.Headline>
                    {hasSubline(event.childEvent) ||
                    hasDescription(event.childEvent) ? (
                      <ListItemEvent.Subline>
                        {hasSubline(event.childEvent) ? (
                          event.childEvent.subline
                        ) : (
                          <RichText
                            html={event.childEvent.description as string}
                          />
                        )}
                      </ListItemEvent.Subline>
                    ) : null}
                    <ListItemEvent.Controls>
                      <Form
                        id={`reject-request-form-${event.childEvent.slug}`}
                        method="POST"
                        preventScrollReset
                      >
                        <input
                          type="hidden"
                          name={EVENT_ID}
                          value={
                            loaderData.eventsWithPendingRequests.find(
                              (event) => event.slug === requests
                            )?.id
                          }
                        />
                        <input
                          type="hidden"
                          name={CHILD_EVENT_ID}
                          value={event.childEvent.id}
                        />
                        <Button
                          type="submit"
                          size="small"
                          fullSize
                          variant="outline"
                          name={INTENT_FIELD_NAME}
                          value={REJECT_PARENT_EVENT_JOIN_REQUEST_INTENT}
                          onClick={(
                            event: React.MouseEvent<HTMLButtonElement>
                          ) => {
                            event.stopPropagation();
                          }}
                        >
                          {locales.route.list.reject.request}
                        </Button>
                      </Form>
                      <Form
                        id={`accept-request-form-${event.childEvent.slug}`}
                        method="POST"
                        preventScrollReset
                      >
                        <input
                          type="hidden"
                          name={EVENT_ID}
                          value={
                            loaderData.eventsWithPendingRequests.find(
                              (event) => event.slug === requests
                            )?.id
                          }
                        />
                        <input
                          type="hidden"
                          name={CHILD_EVENT_ID}
                          value={event.childEvent.id}
                        />
                        <Button
                          type="submit"
                          size="small"
                          fullSize
                          name={INTENT_FIELD_NAME}
                          value={ACCEPT_PARENT_EVENT_JOIN_REQUEST_INTENT}
                          onClick={(
                            event: React.MouseEvent<HTMLButtonElement>
                          ) => {
                            event.stopPropagation();
                          }}
                        >
                          {locales.route.list.accept.request}
                        </Button>
                      </Form>
                    </ListItemEvent.Controls>
                  </ListItemEvent>
                );
              })}
          </List>
        </Container.Section>
      )}
      {hasUpcomingEvents === false && hasPastEvents === false ? (
        <Placeholder>
          <Placeholder.Title>
            {locales.route.placeholder.title}
          </Placeholder.Title>
          <Placeholder.Text>
            {locales.route.placeholder.description}
          </Placeholder.Text>
          <Button
            as="link"
            to="/explore/events"
            variant="outline"
            prefetch="intent"
          >
            {locales.route.placeholder.cta}
          </Button>
        </Placeholder>
      ) : null}
      {hasCanceledEvents ? (
        <Container.Section>
          <Section.Title id="canceled">
            {decideBetweenSingularOrPlural(
              locales.route.canceled.title_one,
              locales.route.canceled.title_other,
              loaderData.canceledEvents.length
            )}
          </Section.Title>
          <Section.Text>
            {decideBetweenSingularOrPlural(
              locales.route.canceled.description_one,
              insertParametersIntoLocale(
                locales.route.canceled.description_other,
                {
                  count: loaderData.canceledEvents.length,
                }
              ),
              loaderData.canceledEvents.length
            )}
          </Section.Text>
          <ListContainer listKey="canceled" locales={locales}>
            {loaderData.canceledEvents.map((event, index) => {
              return (
                <EventListItem
                  key={`canceled-${event.slug}`}
                  to={`/event/${event.slug}/detail/about`}
                  listIndex={index}
                  prefetch="intent"
                >
                  <EventListItem.Image
                    src={event.background}
                    blurredSrc={event.blurredBackground}
                    alt={event.name}
                  />
                  <EventListItem.Content
                    event={event}
                    currentLanguage={language}
                    locales={locales}
                  />
                </EventListItem>
              );
            })}
          </ListContainer>
        </Container.Section>
      ) : null}
      {hasUpcomingEvents ? (
        <Container.Section>
          <Section.Title id="upcoming">
            {decideBetweenSingularOrPlural(
              locales.route.upcoming.title_one,
              locales.route.upcoming.title_other,
              upcomingEventsCount
            )}
          </Section.Title>
          <Section.TabBar>
            {Object.entries(loaderData.upcomingEvents.count).map(
              ([key, value]) => {
                if (value === 0) {
                  return null;
                }
                const typedKey =
                  key as keyof typeof loaderData.upcomingEvents.count;

                const searchParamsCopy = new URLSearchParams(searchParams);
                searchParamsCopy.set("upcoming", key);

                return (
                  <TabBar.Item
                    key={`upcoming-${key}`}
                    active={upcoming === key}
                  >
                    <Link
                      to={`./?${searchParamsCopy.toString()}`}
                      onClick={(event) => {
                        event.preventDefault();
                        setUpcoming(key);
                      }}
                      preventScrollReset
                    >
                      <TabBarTitle>
                        {(() => {
                          let title;
                          if (key in locales.route.tabBar) {
                            type LocaleKey = keyof typeof locales.route.tabBar;
                            title = locales.route.tabBar[key as LocaleKey];
                          } else {
                            console.error(
                              `Tab bar title ${key} not found in locales`
                            );
                            title = key;
                          }
                          return title;
                        })()}
                        <TabBar.Counter active={upcoming === key}>
                          {loaderData.upcomingEvents.count[typedKey]}
                        </TabBar.Counter>
                      </TabBarTitle>
                    </Link>
                  </TabBar.Item>
                );
              }
            )}
          </Section.TabBar>
          <ListContainer listKey="upcoming" hideAfter={3} locales={locales}>
            {loaderData.upcomingEvents[upcoming as "adminEvents"].map(
              (event, index) => {
                return (
                  <EventListItem
                    key={`upcoming-${event.slug}`}
                    to={`/event/${event.slug}/detail/about`}
                    listIndex={index}
                    hideAfter={3}
                    prefetch="intent"
                  >
                    <EventListItem.Image
                      src={event.background}
                      blurredSrc={event.blurredBackground}
                      alt={event.name}
                    />
                    <EventListItem.Content
                      event={event}
                      locales={locales}
                      currentLanguage={language}
                    />
                  </EventListItem>
                );
              }
            )}
          </ListContainer>
        </Container.Section>
      ) : null}
      {hasPastEvents ? (
        <Container.Section>
          <Section.Title id="past">
            {decideBetweenSingularOrPlural(
              locales.route.past.title_one,
              locales.route.past.title_other,
              pastEventsCount
            )}
          </Section.Title>
          <Section.TabBar>
            {Object.entries(loaderData.pastEvents.count).map(([key, value]) => {
              if (value === 0) {
                return null;
              }
              const typedKey = key as keyof typeof loaderData.pastEvents.count;

              const searchParamsCopy = new URLSearchParams(searchParams);
              searchParamsCopy.set("past", key);

              return (
                <TabBar.Item key={`past-${key}`} active={past === key}>
                  <Link
                    to={`./?${searchParamsCopy.toString()}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setPast(key);
                    }}
                    preventScrollReset
                  >
                    <TabBarTitle>
                      {(() => {
                        let title;
                        if (key in locales.route.tabBar) {
                          type LocaleKey = keyof typeof locales.route.tabBar;
                          title = locales.route.tabBar[key as LocaleKey];
                        } else {
                          console.error(
                            `Tab bar title ${key} not found in locales`
                          );
                          title = key;
                        }
                        return title;
                      })()}
                      <TabBar.Counter active={past === key}>
                        {loaderData.pastEvents.count[typedKey]}
                      </TabBar.Counter>
                    </TabBarTitle>
                  </Link>
                </TabBar.Item>
              );
            })}
          </Section.TabBar>
          <ListContainer listKey="past" hideAfter={3} locales={locales}>
            {loaderData.pastEvents[past as "adminEvents"].map(
              (event, index) => {
                return (
                  <EventListItem
                    key={`past-${event.slug}`}
                    to={`/event/${event.slug}/detail/about`}
                    listIndex={index}
                    hideAfter={3}
                    prefetch="intent"
                  >
                    <EventListItem.Image
                      src={event.background}
                      blurredSrc={event.blurredBackground}
                      alt={event.name}
                    />
                    <EventListItem.Content
                      event={event}
                      locales={locales}
                      currentLanguage={language}
                    />
                  </EventListItem>
                );
              }
            )}
          </ListContainer>
        </Container.Section>
      ) : null}
    </Container>
  );
}

export default MyEvents;
