import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { type LoaderFunctionArgs, redirect } from "react-router";
import { Link, useLoaderData, useSearchParams } from "react-router";
import React from "react";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { ListContainer } from "~/components-next/ListContainer";
import { Add } from "~/components-next/icons/Add";
import { Container } from "~/components-next/MyEventsOrganizationDetailContainer";
import { EventListItem } from "~/components-next/EventListItem";
import { Placeholder } from "~/components-next/Placeholder";
import { Section } from "~/components-next/MyEventsProjectsSection";
import { TabBarTitle } from "~/components-next/TabBarTitle";
import { getEvents } from "./events.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";

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

  return {
    upcomingEvents,
    pastEvents,
    canceledEvents,
    abilities,
    locales,
    language,
  };
}

function MyEvents() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;

  const firstUpcoming = Object.entries(loaderData.upcomingEvents.count).find(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_key, value]) => {
      return value > 0;
    }
  ) || ["adminEvents", 0];
  const firstPast = Object.entries(loaderData.pastEvents.count).find(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_key, value]) => {
      return value > 0;
    }
  ) || ["adminEvents", 0];

  const [upcoming, setUpcoming] = React.useState(firstUpcoming[0]);
  const [past, setPast] = React.useState(firstPast[0]);

  const [searchParams, setSearchParams] = useSearchParams({
    upcoming: firstUpcoming[0],
    past: firstPast[0],
  });

  React.useEffect(() => {
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
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("upcoming", upcoming);
    setSearchParams(params, { preventScrollReset: true });
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcoming]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("past", past);
    setSearchParams(params, { preventScrollReset: true });
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [past]);

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

  return (
    <Container>
      <Container.Header>
        <Container.Title>{locales.route.title}</Container.Title>
        {loaderData.abilities["events"].hasAccess ? (
          <Button as="a" href="/event/create">
            <Add />
            {locales.route.create}
          </Button>
        ) : null}
      </Container.Header>
      {hasUpcomingEvents === false && hasPastEvents === false ? (
        <Placeholder>
          <Placeholder.Title>
            {locales.route.placeholder.title}
          </Placeholder.Title>
          <Placeholder.Text>
            {locales.route.placeholder.description}
          </Placeholder.Text>
          <Button as="a" href="/explore/events" variant="outline">
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
                  to={`/event/${event.slug}`}
                  listIndex={index}
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
                    to={`/event/${event.slug}`}
                    listIndex={index}
                    hideAfter={3}
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
                    to={`/event/${event.slug}`}
                    listIndex={index}
                    hideAfter={3}
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
