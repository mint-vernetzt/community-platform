import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { captureException } from "@sentry/node";
import { useEffect, useState } from "react";
import {
  type ActionFunctionArgs,
  Form,
  Link,
  redirect,
  useLoaderData,
  useSearchParams,
  type LoaderFunctionArgs,
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
import {
  checkFeatureAbilitiesOrThrow,
  getFeatureAbilities,
} from "../feature-access.server";
import {
  acceptInviteAsAdmin,
  getEventInvites,
  getEvents,
  rejectInviteAsAdmin,
} from "./events.server";
import {
  ACCEPT_ADMIN_INVITE_INTENT,
  createAcceptOrRejectInviteAsAdminSchema,
  EVENT_ID,
  REJECT_ADMIN_INVITE_INTENT,
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

  const invites = await getEventInvites({
    profileId: sessionUser.id,
    authClient,
  });

  return {
    upcomingEvents,
    pastEvents,
    canceledEvents,
    invites,
    abilities,
    locales,
    language,
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
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
      intent === REJECT_ADMIN_INVITE_INTENT,
    "invalid intent",
    { status: 400 }
  );
  const submission = await parseWithZod(formData, {
    schema: createAcceptOrRejectInviteAsAdminSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  if (intent === ACCEPT_ADMIN_INVITE_INTENT) {
    try {
      await acceptInviteAsAdmin({
        userId: sessionUser.id,
        eventId: submission.value[EVENT_ID],
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "accept-admin-invite-error",
        key: `accept-admin-invite-error-${Date.now()}`,
        message: locales.route.errors.acceptInviteAsAdmin,
        level: "negative",
      });
    }
  } else {
    try {
      await rejectInviteAsAdmin({
        userId: sessionUser.id,
        eventId: submission.value[EVENT_ID],
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "reject-admin-invite-error",
        key: `reject-admin-invite-error-${Date.now()}`,
        message: locales.route.errors.acceptInviteAsAdmin,
        level: "negative",
      });
    }
  }

  return redirectWithToast(request.url, {
    id: "admin-invite-success",
    key: `admin-invite-success-${Date.now()}`,
    message:
      intent === "reject-admin-invite"
        ? locales.route.success.rejectInviteAsAdmin
        : locales.route.success.acceptInviteAsAdmin,
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

  const [upcoming, setUpcoming] = useState(firstUpcoming[0]);
  const [past, setPast] = useState(firstPast[0]);
  const [invites, setInvites] = useState(firstInvites[0]);
  const [searchParams, setSearchParams] = useSearchParams({
    upcoming: firstUpcoming[0],
    past: firstPast[0],
    invites: firstInvites[0],
  });

  useEffect(() => {
    if (searchParams.has("upcoming")) {
      const newValue = searchParams.get("upcoming") as string;
      if (newValue !== upcoming) {
        setUpcoming(newValue);
      }
    }
    if (searchParams.has("past")) {
      const newValue = searchParams.get("past") as string;
      if (newValue !== past) {
        setPast(newValue);
      }
    }
    if (searchParams.has("invites")) {
      const newValue = searchParams.get("invites") as string;
      if (newValue !== invites) {
        setInvites(newValue);
      }
    }
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("upcoming", upcoming);
    setSearchParams(params, { preventScrollReset: true });
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcoming]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("past", past);
    setSearchParams(params, { preventScrollReset: true });
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [past]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("invites", invites);
    setSearchParams(params, { preventScrollReset: true });
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invites]);

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
      {hasAdminInvites && (
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
                const { event } = invite;
                return (
                  <ListItemEvent
                    key={`past-${event.slug}`}
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
                        id={`reject-admin-invite-form-${event.id}`}
                        method="POST"
                        preventScrollReset
                      >
                        <input type="hidden" name={EVENT_ID} value={event.id} />
                        <Button
                          type="submit"
                          size="small"
                          variant="outline"
                          name={INTENT_FIELD_NAME}
                          value={REJECT_ADMIN_INVITE_INTENT}
                          onClick={(
                            event: React.MouseEvent<HTMLButtonElement>
                          ) => {
                            event.stopPropagation();
                          }}
                        >
                          {locales.route.list.reject}
                        </Button>
                      </Form>
                      <Form
                        id={`accept-admin-invite-form-${event.id}`}
                        method="POST"
                        preventScrollReset
                      >
                        <input type="hidden" name={EVENT_ID} value={event.id} />
                        <Button
                          type="submit"
                          size="small"
                          name={INTENT_FIELD_NAME}
                          value={ACCEPT_ADMIN_INVITE_INTENT}
                          onClick={(
                            event: React.MouseEvent<HTMLButtonElement>
                          ) => {
                            event.stopPropagation();
                          }}
                        >
                          {locales.route.list.accept}
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
