import { Button, CardContainer, EventCard } from "@mint-vernetzt/components";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { GravityType } from "imgproxy/dist/types";
import React from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getImageURL } from "~/images.server";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
} from "~/public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { getPaginationValues } from "../explore/utils.server";
import {
  enhanceEventsWithParticipationStatus,
  getQueryValueAsArrayOfWords,
  searchEventsViaLike,
} from "./utils.server";
import { useHydrated } from "remix-utils";
import { useTranslation } from "react-i18next";

const i18nNS = ["routes/search/events"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { skip, take, page, itemsPerPage } = getPaginationValues(request);

  const rawEvents = await searchEventsViaLike(
    searchQuery,
    sessionUser,
    skip,
    take
  );

  const enhancedEvents = [];

  for (const event of rawEvents) {
    let enhancedEvent = {
      ...event,
    };

    if (sessionUser === null) {
      // Filter event
      enhancedEvent = await filterEventByVisibility<typeof enhancedEvent>(
        enhancedEvent
      );
      // Filter responsible organizations of event
      enhancedEvent.responsibleOrganizations = await Promise.all(
        enhancedEvent.responsibleOrganizations.map(async (relation) => {
          const filteredOrganization = await filterOrganizationByVisibility<
            typeof relation.organization
          >(relation.organization);
          return { ...relation, organization: filteredOrganization };
        })
      );
    }

    // Add images from image proxy
    let blurredBackground;
    if (enhancedEvent.background !== null) {
      const publicURL = getPublicURL(authClient, enhancedEvent.background);
      if (publicURL) {
        enhancedEvent.background = getImageURL(publicURL, {
          resize: { type: "fill", width: 594, height: 396 },
        });
      }
      blurredBackground = getImageURL(publicURL, {
        resize: { type: "fill", width: 18, height: 12 },
        blur: 5,
      });
    } else {
      enhancedEvent.background = "/images/default-event-background.jpg";
      blurredBackground = "/images/default-event-background-blurred.jpg";
    }

    enhancedEvent.responsibleOrganizations =
      enhancedEvent.responsibleOrganizations.map((relation) => {
        let logo = relation.organization.logo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL) {
            logo = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        return {
          ...relation,
          organization: { ...relation.organization, logo },
        };
      });

    const imageEnhancedEvent = {
      ...enhancedEvent,
      blurredBackground,
    };

    enhancedEvents.push(imageEnhancedEvent);
  }

  const enhancedEventsWithParticipationStatus =
    await enhanceEventsWithParticipationStatus(sessionUser, enhancedEvents);

  return json(
    {
      events: enhancedEventsWithParticipationStatus,
      userId: sessionUser?.id || undefined,
      pagination: {
        page,
        itemsPerPage,
      },
    },
    { headers: response.headers }
  );
};

export default function SearchView() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const fetcher = useFetcher<typeof loader>();
  const [items, setItems] = React.useState(loaderData.events);
  const [shouldFetch, setShouldFetch] = React.useState(() => {
    if (loaderData.events.length < loaderData.pagination.itemsPerPage) {
      return false;
    }
    return true;
  });
  const [page, setPage] = React.useState(() => {
    const pageParam = searchParams.get("page");
    if (pageParam !== null) {
      return parseInt(pageParam);
    }
    return 1;
  });
  React.useEffect(() => {
    if (fetcher.data !== undefined) {
      setItems((events) => {
        return fetcher.data !== undefined
          ? [...events, ...fetcher.data.events]
          : [...events];
      });
      setPage(fetcher.data.pagination.page);
      if (fetcher.data.events.length < fetcher.data.pagination.itemsPerPage) {
        setShouldFetch(false);
      }
    }
  }, [fetcher.data]);

  React.useEffect(() => {
    if (loaderData.events.length < loaderData.pagination.itemsPerPage) {
      setShouldFetch(false);
    }
    setItems(loaderData.events);
  }, [loaderData.events, loaderData.pagination.itemsPerPage]);

  const query = searchParams.get("query") ?? "";

  const isHydrated = useHydrated();

  const { t } = useTranslation(i18nNS);

  return (
    <>
      {items.length > 0 ? (
        <>
          <section className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
            <CardContainer type="multi row">
              {items.length > 0 ? (
                items.map((event) => {
                  const startTime = utcToZonedTime(
                    event.startTime,
                    "Europe/Berlin"
                  );
                  const endTime = utcToZonedTime(
                    event.endTime,
                    "Europe/Berlin"
                  );
                  const participationUntil = utcToZonedTime(
                    event.participationUntil,
                    "Europe/Berlin"
                  );
                  return (
                    <EventCard
                      key={event.id}
                      publicAccess={typeof loaderData.userId === "undefined"}
                      isHydrated={isHydrated}
                      event={{
                        ...event,
                        startTime,
                        endTime,
                        participationUntil,
                        responsibleOrganizations:
                          event.responsibleOrganizations.map(
                            // TODO: fix any type
                            (item: any) => item.organization
                          ),
                      }}
                    />
                  );
                })
              ) : (
                <p>{t("empty.profiles")}</p>
              )}
            </CardContainer>
          </section>
          {shouldFetch && (
            <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 md:mv-mb-24 lg:mv-mb-8 mv-mt-4 lg:mv-mt-8">
              <fetcher.Form method="get">
                <input key="query" type="hidden" name="query" value={query} />
                <input key="page" type="hidden" name="page" value={page + 1} />
                <Button
                  size="large"
                  variant="outline"
                  loading={fetcher.state === "submitting"}
                >
                  {t("more")}
                </Button>
              </fetcher.Form>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-primary">{t("empty.events")}</p>
      )}
    </>
  );
}
