import { Button, CardContainer, EventCard } from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { useTranslation } from "react-i18next";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { GravityType, getImageURL } from "~/images.server";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import {
  countSearchedEvents,
  enhanceEventsWithParticipationStatus,
  getQueryValueAsArrayOfWords,
  getTakeParam,
  searchEventsViaLike,
} from "./utils.server";

const i18nNS = ["routes/search/events"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { take, page, itemsPerPage } = getTakeParam(request);

  const eventsCount = await countSearchedEvents(searchQuery, sessionUser);

  const rawEvents = await searchEventsViaLike(searchQuery, sessionUser, take);

  const enhancedEvents = [];

  for (const event of rawEvents) {
    let enhancedEvent = {
      ...event,
    };

    if (sessionUser === null) {
      // Filter event
      type EnhancedEvent = typeof enhancedEvent;
      enhancedEvent = filterEventByVisibility<EnhancedEvent>(enhancedEvent);
      // Filter responsible organizations of event
      enhancedEvent.responsibleOrganizations =
        enhancedEvent.responsibleOrganizations.map((relation) => {
          type Organization = typeof relation.organization;
          const filteredOrganization =
            filterOrganizationByVisibility<Organization>(relation.organization);
          return { ...relation, organization: filteredOrganization };
        });
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
              resize: { type: "fill", width: 36, height: 36 },
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

  return json({
    events: enhancedEventsWithParticipationStatus,
    count: eventsCount,
    userId: sessionUser?.id || undefined,
    pagination: {
      page,
      itemsPerPage,
    },
  });
};

export default function SearchView() {
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const navigation = useNavigation();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${loaderData.pagination.page + 1}`);
  const isHydrated = useHydrated();

  return (
    <>
      {loaderData.events.length > 0 ? (
        <>
          <section className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
            <CardContainer type="multi row">
              {loaderData.events.length > 0 ? (
                loaderData.events.map((event) => {
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
                <p>{t("empty.events")}</p>
              )}
            </CardContainer>
          </section>
          {loaderData.count > loaderData.events.length && (
            <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 @md:mv-mb-24 @lg:mv-mb-8 mv-mt-4 @lg:mv-mt-8">
              <Link
                to={`?${loadMoreSearchParams.toString()}`}
                preventScrollReset
                replace
              >
                <Button
                  size="large"
                  variant="outline"
                  loading={navigation.state === "loading"}
                  disabled={navigation.state === "loading"}
                >
                  {t("more")}
                </Button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-primary">{t("empty.events")}</p>
      )}
    </>
  );
}
