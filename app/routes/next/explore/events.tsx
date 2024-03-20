import { parseWithZod } from "@conform-to/zod-v1";
import { Button, CardContainer, EventCard } from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import React from "react";
import { useTranslation } from "react-i18next";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { GravityType, getImageURL } from "~/images.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import {
  enhanceEventsWithParticipationStatus,
  getAllEventTargetGroups,
  getAllEventTypes,
  getAllEvents,
  getAllFocuses,
  getEventFilterVector,
  getEventsCount,
  getFilterCountForSlug,
  getTakeParam,
  getVisibilityFilteredEventsCount,
} from "./events.server";
import { getAreaNameBySlug, getAreasBySearchQuery } from "./utils.server";

const i18nNS = ["routes/explore/events"];
export const handle = {
  i18n: i18nNS,
};

const sortValues = ["name-asc", "name-desc", "createdAt-desc"] as const;

export type GetEventsSchema = z.infer<typeof getEventsSchema>;

const getEventsSchema = z.object({
  filter: z
    .object({
      type: z.array(z.string()),
      focus: z.array(z.string()),
      eventTargetGroup: z.array(z.string()),
      area: z.array(z.string()),
    })
    .optional(),
  sortBy: z
    .enum(sortValues)
    .optional()
    .transform((sortValue) => {
      if (sortValue !== undefined) {
        const splittedValue = sortValue.split("-");
        return {
          value: splittedValue[0],
          direction: splittedValue[1],
        };
      }
      return sortValue;
    }),
  page: z.number().optional(),
  search: z.string().optional(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const submission = parseWithZod(searchParams, {
    schema: getEventsSchema,
  });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );
  const take = getTakeParam(submission.value.page);
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["filter"]);
  if (abilities.filter.hasAccess === false) {
    return redirect("/explore/organizations");
  }

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let filteredByVisibilityCount;
  if (!isLoggedIn && submission.value.filter !== undefined) {
    filteredByVisibilityCount = await getVisibilityFilteredEventsCount({
      filter: submission.value.filter,
    });
  }
  const eventsCount = await getEventsCount({
    filter: submission.value.filter,
  });
  const events = await getAllEvents({
    filter: submission.value.filter,
    sortBy: submission.value.sortBy,
    take,
    isLoggedIn,
  });

  const enhancedEvents = [];
  for (const event of events) {
    let enhancedEvent = {
      ...event,
    };

    // Filtering by visbility settings
    if (sessionUser === null) {
      // Filter event
      enhancedEvent =
        filterEventByVisibility<typeof enhancedEvent>(enhancedEvent);
      // Filter responsible Organizations
      enhancedEvent.responsibleOrganizations =
        enhancedEvent.responsibleOrganizations.map((relation) => {
          const filteredOrganization = filterOrganizationByVisibility<
            typeof relation.organization
          >(relation.organization);
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

  const filterVector = await getEventFilterVector({
    filter: submission.value.filter,
  });

  const areas = await getAreasBySearchQuery(submission.value.search);
  type EnhancedAreas = Array<
    ArrayElement<Awaited<ReturnType<typeof getAreasBySearchQuery>>> & {
      vectorCount: ReturnType<typeof getFilterCountForSlug>;
      isChecked: boolean;
    }
  >;
  const enhancedAreas = {
    global: [] as EnhancedAreas,
    country: [] as EnhancedAreas,
    state: [] as EnhancedAreas,
    district: [] as EnhancedAreas,
  };
  for (const area of areas) {
    const vectorCount = getFilterCountForSlug(area.slug, filterVector, "area");
    let isChecked;
    // TODO: Remove '|| area.slug === null' when slug isn't optional anymore (after migration)
    if (submission.value.filter === undefined || area.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.area.includes(area.slug);
    }
    const enhancedArea = {
      ...area,
      vectorCount,
      isChecked,
    };
    enhancedAreas[area.type].push(enhancedArea);
  }
  let selectedAreas: Array<{
    slug: string;
    name: string | null;
    vectorCount: number;
    isInSearchResultsList: boolean;
  }> = [];
  if (submission.value.filter !== undefined) {
    selectedAreas = await Promise.all(
      submission.value.filter.area.map(async (slug) => {
        const vectorCount = getFilterCountForSlug(slug, filterVector, "area");
        const isInSearchResultsList = areas.some((area) => {
          return area.slug === slug;
        });
        return {
          slug,
          name: (await getAreaNameBySlug(slug)) || null,
          vectorCount,
          isInSearchResultsList,
        };
      })
    );
  }

  const types = await getAllEventTypes();
  const enhancedTypes = types.map((type) => {
    const vectorCount = getFilterCountForSlug(type.slug, filterVector, "type");
    let isChecked;
    // TODO: Remove '|| offer.slug === null' when slug isn't optional anymore (after migration)
    if (submission.value.filter === undefined || type.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.type.includes(type.slug);
    }
    return { ...type, vectorCount, isChecked };
  });
  let selectedTypes: Array<{ slug: string; title: string | null }> = [];
  if (submission.value.filter !== undefined) {
    selectedTypes = submission.value.filter.type.map((slug) => {
      const typeMatch = types.find((type) => {
        return type.slug === slug;
      });
      return {
        slug,
        title: typeMatch?.title || null,
      };
    });
  }

  const focuses = await getAllFocuses();
  const enhancedFocuses = focuses.map((focus) => {
    const vectorCount = getFilterCountForSlug(
      focus.slug,
      filterVector,
      "focus"
    );
    let isChecked;
    // TODO: Remove '|| offer.slug === null' when slug isn't optional anymore (after migration)
    if (submission.value.filter === undefined || focus.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.focus.includes(focus.slug);
    }
    return { ...focus, vectorCount, isChecked };
  });
  let selectedFocuses: Array<{ slug: string; title: string | null }> = [];
  if (submission.value.filter !== undefined) {
    selectedFocuses = submission.value.filter.focus.map((slug) => {
      const focusMatch = focuses.find((focus) => {
        return focus.slug === slug;
      });
      return {
        slug,
        title: focusMatch?.title || null,
      };
    });
  }

  const targetGroups = await getAllEventTargetGroups();
  const enhancedTargetGroups = targetGroups.map((targetGroup) => {
    const vectorCount = getFilterCountForSlug(
      targetGroup.slug,
      filterVector,
      "eventTargetGroup"
    );
    let isChecked;
    // TODO: Remove '|| offer.slug === null' when slug isn't optional anymore (after migration)
    if (submission.value.filter === undefined || targetGroup.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.eventTargetGroup.includes(
        targetGroup.slug
      );
    }
    return { ...targetGroup, vectorCount, isChecked };
  });
  let selectedTargetGroups: Array<{ slug: string; title: string | null }> = [];
  if (submission.value.filter !== undefined) {
    selectedTargetGroups = submission.value.filter.eventTargetGroup.map(
      (slug) => {
        const targetGroupMatch = targetGroups.find((targetGroup) => {
          return targetGroup.slug === slug;
        });
        return {
          slug,
          title: targetGroupMatch?.title || null,
        };
      }
    );
  }

  let transformedSubmission;
  if (submission.value.sortBy !== undefined) {
    transformedSubmission = {
      ...submission,
      value: {
        ...submission.value,
        sortBy: `${submission.value.sortBy.value}-${submission.value.sortBy.direction}`,
      },
    };
  } else {
    transformedSubmission = {
      ...submission,
      value: {
        ...submission.value,
        sortBy: sortValues[0],
      },
    };
  }

  return json({
    isLoggedIn,
    events: enhancedEventsWithParticipationStatus,
    areas: enhancedAreas,
    selectedAreas,
    focuses: enhancedFocuses,
    selectedFocuses,
    targetGroups: enhancedTargetGroups,
    selectedTargetGroups,
    types: enhancedTypes,
    selectedTypes,
    submission: transformedSubmission,
    filteredByVisibilityCount,
    eventsCount,
  });
};

function Events() {
  const loaderData = useLoaderData<typeof loader>();

  const fetcher = useFetcher<typeof loader>();
  const [searchParams] = useSearchParams();

  const [events, setEvents] = React.useState(loaderData.events);
  const [shouldFetchEvents, setShouldFetchEvents] = React.useState(() => {
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
      setEvents((events) => {
        return fetcher.data !== undefined
          ? [...events, ...fetcher.data.events]
          : [...events];
      });
      setPage(fetcher.data.pagination.page);
      if (fetcher.data.events.length < fetcher.data.pagination.itemsPerPage) {
        setShouldFetchEvents(false);
      }
    }
  }, [fetcher.data]);

  const isHydrated = useHydrated();

  const { t } = useTranslation(i18nNS);

  return (
    <>
      <section className="container my-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">{t("title")}</H1>
        <p className="">{t("intro")}</p>
      </section>
      <section className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        <CardContainer type="multi row">
          {events.length > 0 ? (
            events.map((event) => {
              const startTime = utcToZonedTime(
                event.startTime,
                "Europe/Berlin"
              );
              const endTime = utcToZonedTime(event.endTime, "Europe/Berlin");
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
            <p>{t("empty")}</p>
          )}
        </CardContainer>
      </section>
      {shouldFetchEvents && (
        <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 md:mv-mb-24 lg:mv-mb-8 mv-mt-4 lg:mv-mt-8">
          <fetcher.Form method="get">
            <input key="page" type="hidden" name="page" value={page + 1} />
            <Button
              size="large"
              variant="outline"
              loading={fetcher.state === "loading"}
            >
              {t("more")}
            </Button>
          </fetcher.Form>
        </div>
      )}
    </>
  );
}

export default Events;
