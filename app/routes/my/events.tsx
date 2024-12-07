import { TabBar, Button } from "@mint-vernetzt/components";
import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { ListContainer } from "./__components";
import {
  AddIcon,
  Container,
  ListItem,
  Placeholder,
  Section,
  TabBarTitle,
} from "./__events.components";
import { getEvents } from "./events.server";

export const i18nNS = [
  "routes/my/events",
  "datasets/stages",
  "components",
] as const;

export const handle = {
  i18n: i18nNS,
};

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["events"]);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

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

  return json({ upcomingEvents, pastEvents, canceledEvents, abilities });
}

function MyEvents() {
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();

  const firstUpcoming = Object.entries(loaderData.upcomingEvents.count).find(
    ([_, value]) => {
      return value > 0;
    }
  ) || ["adminEvents", 0];
  const firstPast = Object.entries(loaderData.pastEvents.count).find(
    ([_, value]) => {
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
  }, [searchParams]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("upcoming", upcoming);
    setSearchParams(params, { preventScrollReset: true });
  }, [upcoming]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("past", past);
    setSearchParams(params, { preventScrollReset: true });
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
        <Container.Title>{t("title")}</Container.Title>
        {loaderData.abilities["events"].hasAccess ? (
          <Button as="a" href="/event/create">
            <AddIcon />
            {t("create")}
          </Button>
        ) : null}
      </Container.Header>
      {hasUpcomingEvents === false && hasPastEvents === false ? (
        <Placeholder>
          <Placeholder.Title>{t("placeholder.title")}</Placeholder.Title>
          <Placeholder.Text>{t("placeholder.description")}</Placeholder.Text>
          <Button as="a" href="/explore/events" variant="outline">
            {t("placeholder.cta")}
          </Button>
        </Placeholder>
      ) : null}
      {hasCanceledEvents ? (
        <Container.Section>
          <Section.Title id="canceled">
            {t("canceled.title", { count: loaderData.canceledEvents.length })}
          </Section.Title>
          <Section.Text>
            {t("canceled.description", {
              count: loaderData.canceledEvents.length,
            })}
          </Section.Text>
          <ListContainer listKey="canceled">
            {loaderData.canceledEvents.map((event, index) => {
              return (
                <ListItem.Event
                  key={`canceled-${event.slug}`}
                  to={`/event/${event.slug}`}
                  listIndex={index}
                >
                  <ListItem.Event.Image
                    src={event.background}
                    blurredSrc={event.blurredBackground}
                    alt={event.name}
                  />
                  <ListItem.Event.Content event={event} />
                </ListItem.Event>
              );
            })}
          </ListContainer>
        </Container.Section>
      ) : null}
      {hasUpcomingEvents ? (
        <Container.Section>
          <Section.Title id="upcoming">
            {t("upcoming.title", {
              count: upcomingEventsCount,
            })}
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
                        {t(`tabBar.${key}`)}
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
          <ListContainer listKey="upcoming" hideAfter={3}>
            {loaderData.upcomingEvents[upcoming as "adminEvents"].map(
              (event, index) => {
                return (
                  <ListItem.Event
                    key={`upcoming-${event.slug}`}
                    to={`/event/${event.slug}`}
                    listIndex={index}
                    hideAfter={3}
                  >
                    <ListItem.Event.Image
                      src={event.background}
                      blurredSrc={event.blurredBackground}
                      alt={event.name}
                    />
                    <ListItem.Event.Content event={event} />
                  </ListItem.Event>
                );
              }
            )}
          </ListContainer>
        </Container.Section>
      ) : null}
      {hasPastEvents ? (
        <Container.Section>
          <Section.Title id="past">
            {t("past.title", { count: pastEventsCount })}
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
                      {t(`tabBar.${key}`)}
                      <TabBar.Counter active={past === key}>
                        {loaderData.pastEvents.count[typedKey]}
                      </TabBar.Counter>
                    </TabBarTitle>
                  </Link>
                </TabBar.Item>
              );
            })}
          </Section.TabBar>
          <ListContainer listKey="past" hideAfter={3}>
            {loaderData.pastEvents[past as "adminEvents"].map(
              (event, index) => {
                return (
                  <ListItem.Event
                    key={`past-${event.slug}`}
                    to={`/event/${event.slug}`}
                    listIndex={index}
                    hideAfter={3}
                  >
                    <ListItem.Event.Image
                      src={event.background}
                      blurredSrc={event.blurredBackground}
                      alt={event.name}
                    />
                    <ListItem.Event.Content event={event} />
                  </ListItem.Event>
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
