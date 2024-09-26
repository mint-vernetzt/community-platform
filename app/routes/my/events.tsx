import { useTranslation } from "react-i18next";
import {
  Container,
  Placeholder,
  Button,
  AddIcon,
  Section,
  TabBarTitle,
  ListItem,
} from "./__events.components";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { getUpcomingEvents } from "./events.server";
import { TabBar } from "@mint-vernetzt/components";
import React from "react";
import { ListContainer } from "./__components";

export const i18nNS = ["routes/my/events"];

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["my_events"]);

  if (abilities.my_events.hasAccess === false) {
    return redirect("/");
  }

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const upcomingEvents = await getUpcomingEvents(sessionUser.id, authClient);

  return json({ upcomingEvents });
}

function MyEvents() {
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();

  const firstUpcoming = Object.entries(loaderData.upcomingEvents.count).find(
    ([_, value]) => {
      return value > 0;
    }
  ) || ["admin", 0];
  const [upcoming, setUpcoming] = React.useState(firstUpcoming[0]);

  const [searchParams, setSearchParams] = useSearchParams({
    upcoming: firstUpcoming[0],
  });

  React.useEffect(() => {
    if (searchParams.has("upcoming")) {
      setUpcoming(searchParams.get("upcoming") as string);
    }
  }, [searchParams]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("upcoming", upcoming);
    setSearchParams(params);
  }, [upcoming]);

  const hasUpcomingEvents = Object.values(loaderData.upcomingEvents.count).some(
    (count) => count > 0
  );

  return (
    <Container>
      <Container.Header>
        <Container.Title>{t("title")}</Container.Title>
        <Button>
          <Link to="/event/create">
            <AddIcon />
            {t("create")}
          </Link>
        </Button>
      </Container.Header>
      {hasUpcomingEvents === false ? (
        <Placeholder>
          <Placeholder.Title>{t("placeholder.title")}</Placeholder.Title>
          <Placeholder.Text>{t("placeholder.description")}</Placeholder.Text>
          <Button style="secondary">
            <Link to="/explore/events">{t("placeholder.cta")}</Link>
          </Button>
        </Placeholder>
      ) : null}
      {hasUpcomingEvents ? (
        <Container.Section>
          <Section.Title id="upcoming">{t("upcoming.title")}</Section.Title>
          <Section.TabBar>
            {Object.entries(loaderData.upcomingEvents.count).map(
              ([key, value]) => {
                if (value === 0) {
                  return null;
                }

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
                          {loaderData.upcomingEvents.count[key as "admin"]}
                        </TabBar.Counter>
                      </TabBarTitle>
                    </Link>
                  </TabBar.Item>
                );
              }
            )}
          </Section.TabBar>
          <ListContainer listKey="upcoming">
            {loaderData.upcomingEvents[upcoming as "admin"].map(
              (event, index) => {
                return (
                  <ListItem.Event
                    key={`upcoming-${event.slug}`}
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
              }
            )}
          </ListContainer>
        </Container.Section>
      ) : null}
    </Container>
  );
}

export default MyEvents;
