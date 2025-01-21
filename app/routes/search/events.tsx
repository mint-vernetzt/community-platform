import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { createAuthClient, getSessionUser } from "~/auth.server";
import {
  BlurFactor,
  DefaultImages,
  ImageSizes,
  getImageURL,
} from "~/images.server";
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
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { EventCard } from "@mint-vernetzt/components/src/organisms/cards/EventCard";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/i18n.server";
import { prismaClient } from "~/prisma.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["search/events"];

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { take, page, itemsPerPage } = getTakeParam(request);

  let eventsCount: Awaited<ReturnType<typeof countSearchedEvents>>;
  let rawEvents: Awaited<ReturnType<typeof searchEventsViaLike>>;
  if (searchQuery.length === 0) {
    eventsCount = 0;
    rawEvents = [];
  } else {
    const eventsCountQuery = countSearchedEvents(searchQuery, sessionUser);
    const rawEventsQuery = searchEventsViaLike(searchQuery, sessionUser, take);
    const [eventsCountResult, rawEventsResult] =
      await prismaClient.$transaction([eventsCountQuery, rawEventsQuery]);
    eventsCount = eventsCountResult;
    rawEvents = rawEventsResult;
  }

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
    let background = enhancedEvent.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Event.Card.Background },
        });
      }
      blurredBackground = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.Card.BlurredBackground },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }

    const responsibleOrganizations = enhancedEvent.responsibleOrganizations.map(
      (relation) => {
        let logo = relation.organization.logo;
        let blurredLogo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL) {
            logo = getImageURL(publicURL, {
              resize: {
                type: "fill",
                ...ImageSizes.Organization.CardFooter.Logo,
              },
            });
            blurredLogo = getImageURL(publicURL, {
              resize: {
                type: "fill",
                ...ImageSizes.Organization.CardFooter.BlurredLogo,
              },
              blur: BlurFactor,
            });
          }
        }
        return {
          ...relation,
          organization: { ...relation.organization, logo, blurredLogo },
        };
      }
    );

    const imageEnhancedEvent = {
      ...enhancedEvent,
      responsibleOrganizations,
      background,
      blurredBackground,
    };

    enhancedEvents.push(imageEnhancedEvent);
  }

  const enhancedEventsWithParticipationStatus =
    await enhanceEventsWithParticipationStatus(sessionUser, enhancedEvents);

  return {
    events: enhancedEventsWithParticipationStatus,
    count: eventsCount,
    userId: sessionUser?.id || undefined,
    pagination: {
      page,
      itemsPerPage,
    },
    locales,
    language,
  };
};

export default function SearchView() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;
  const [searchParams] = useSearchParams();

  const navigation = useNavigation();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${loaderData.pagination.page + 1}`);

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
                      event={{
                        ...event,
                        startTime,
                        endTime,
                        participationUntil,
                        responsibleOrganizations:
                          event.responsibleOrganizations.map(
                            (relation) => relation.organization
                          ),
                      }}
                      locales={locales}
                      currentLanguage={language}
                    />
                  );
                })
              ) : (
                <p>{locales.route.empty.events}</p>
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
                  {locales.route.more}
                </Button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-primary">{locales.route.empty.events}</p>
      )}
    </>
  );
}
