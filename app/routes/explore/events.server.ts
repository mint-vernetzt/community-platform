import { type User } from "@supabase/supabase-js";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { type GetEventsSchema } from "./events.shared";
import { type GetSearchSchema } from "./all.shared";
import { getAllSlugsFromLocaleThatContainsWord } from "~/i18n.server";
import { type Prisma } from "@prisma/client";

export type ExploreEventsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["explore/events"];

export function getTakeParam(page: GetEventsSchema["evtPage"]) {
  const itemsPerPage = 12;
  const take = itemsPerPage * page;
  return take;
}

function dateToPostgresTimestamp(date: Date) {
  const dateString = date.toDateString();
  const dateArray = dateString.split(" ");
  const timeString = date.toTimeString();
  const timeArray = timeString.split(" ");
  dateArray.splice(3, 0, timeArray[0]);
  const postgresTimestamp = dateArray.join(" ");
  return `'${postgresTimestamp}'`;
}

function getWhereStatementFromPeriodOfTime(
  periodOfTime: GetEventsSchema["evtFilter"]["periodOfTime"],
  sqlType: "prisma" | "raw" = "prisma"
) {
  const now = new Date();
  if (periodOfTime === "past") {
    return sqlType === "prisma"
      ? {
          endTime: {
            lte: now,
          },
        }
      : `end_time <= ${dateToPostgresTimestamp(now)}`;
  }
  if (periodOfTime === "thisWeek" || periodOfTime === "nextWeek") {
    const currentDay = now.getDay();
    let daysUntilMonday = (8 - currentDay) % 7;

    if (daysUntilMonday === 0) {
      daysUntilMonday = 7;
    }

    const nextMonday = new Date(
      now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000
    );
    nextMonday.setHours(0, 0, 0, 0);
    if (periodOfTime === "thisWeek") {
      return sqlType === "prisma"
        ? {
            endTime: {
              gte: now,
            },
            startTime: {
              lte: nextMonday,
            },
          }
        : `end_time >= ${dateToPostgresTimestamp(
            now
          )} AND start_time <= ${dateToPostgresTimestamp(nextMonday)}`;
    } else {
      const daysUntilSecondMonday = daysUntilMonday + 7;
      const secondMonday = new Date(
        now.getTime() + daysUntilSecondMonday * 24 * 60 * 60 * 1000
      );
      return sqlType === "prisma"
        ? {
            endTime: {
              gte: nextMonday,
            },
            startTime: {
              lte: secondMonday,
            },
          }
        : `end_time >= ${dateToPostgresTimestamp(
            nextMonday
          )} AND start_time <= ${dateToPostgresTimestamp(secondMonday)}`;
    }
  }
  if (periodOfTime === "thisMonth" || periodOfTime === "nextMonth") {
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const firstDayOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
    firstDayOfNextMonth.setHours(0, 0, 0, 0);
    if (periodOfTime === "thisMonth") {
      return sqlType === "prisma"
        ? {
            endTime: {
              gte: now,
            },
            startTime: {
              lte: firstDayOfNextMonth,
            },
          }
        : `end_time >= ${dateToPostgresTimestamp(
            now
          )} AND start_time <= ${dateToPostgresTimestamp(firstDayOfNextMonth)}`;
    } else {
      const firstDayOfSecondMonth = new Date(currentYear, currentMonth + 2, 1);
      firstDayOfNextMonth.setHours(0, 0, 0, 0);
      return sqlType === "prisma"
        ? {
            endTime: {
              gte: firstDayOfNextMonth,
            },
            startTime: {
              lte: firstDayOfSecondMonth,
            },
          }
        : `end_time >= ${dateToPostgresTimestamp(
            firstDayOfNextMonth
          )} AND start_time <= ${dateToPostgresTimestamp(
            firstDayOfSecondMonth
          )}`;
    }
  }
  return sqlType === "prisma"
    ? {
        endTime: {
          gte: now,
        },
      }
    : `end_time >= ${dateToPostgresTimestamp(now)}`;
}

type EventVisibility = { eventVisibility: { [x: string]: boolean } };
type FilterKeyWhereStatement = {
  OR: {
    [x: string]: { some: { [x: string]: { slug: string } } } | { slug: string };
  }[] &
    ReturnType<typeof getWhereStatementFromPeriodOfTime>[];
};
type SearchWhereStatement = {
  OR: {
    AND: (
      | {
          [K in Event as string]: {
            contains: string;
            mode: Prisma.QueryMode;
          };
        }
      | {
          [K in "types" | "focuses" | "tags" | "eventTargetGroups"]?: {
            some: {
              [K in "eventType" | "focus" | "tag" | "eventTargetGroup"]?: {
                slug: {
                  in: string[];
                  mode: Prisma.QueryMode;
                };
              };
            };
          };
        }
      | {
          [K in "experienceLevel" | "stage"]?: {
            slug: {
              in: string[];
              mode: Prisma.QueryMode;
            };
          };
        }
      | {
          [K in "eventVisibility"]?: {
            [K in Event as string]: boolean;
          };
        }
    )[];
  }[];
};
type WhereClause = {
  AND: EventVisibility[] & FilterKeyWhereStatement[] & SearchWhereStatement[];
};

function getEventsFilterWhereClause(filter: GetEventsSchema["evtFilter"]) {
  const whereClauses: WhereClause = { AND: [] };

  for (const filterKey in filter) {
    const typedFilterKey = filterKey as keyof typeof filter;

    const filterKeyWhereStatement: FilterKeyWhereStatement = { OR: [] };

    if (typedFilterKey === "periodOfTime") {
      const filterValue = filter[typedFilterKey];
      const filterWhereStatement =
        getWhereStatementFromPeriodOfTime(filterValue);
      // I had to do this because typescript can't resolve the correct return type of getWhereStatementFromPeriodOfTime()
      invariantResponse(
        typeof filterWhereStatement !== "string",
        "Please provide prisma sql syntax",
        { status: 500 }
      );
      filterKeyWhereStatement.OR.push(filterWhereStatement);
    } else if (typedFilterKey === "stage") {
      const filterValue = filter[typedFilterKey];
      if (typeof filterValue === "string" && filterValue !== "all") {
        const filterWhereStatement = {
          stage: {
            slug: filterValue,
          },
        };
        filterKeyWhereStatement.OR.push(filterWhereStatement);
      }
    } else {
      const filterValues = filter[typedFilterKey];
      for (const slug of filterValues) {
        const filterWhereStatement = {
          [`${typedFilterKey}${typedFilterKey === "focus" ? "es" : "s"}`]: {
            some: {
              [typedFilterKey]: {
                slug,
              },
            },
          },
        };
        filterKeyWhereStatement.OR.push(filterWhereStatement);
      }
    }

    whereClauses.AND.push(filterKeyWhereStatement);
  }

  return whereClauses;
}

function getEventsSearchWhereClause(
  words: string[],
  isLoggedIn: boolean,
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>
) {
  const whereClauses = [];
  for (const word of words) {
    const eventTypeSlugs = getAllSlugsFromLocaleThatContainsWord({
      language,
      locales: "eventTypes",
      word,
    });
    const focusSlugs = getAllSlugsFromLocaleThatContainsWord({
      language,
      locales: "focuses",
      word,
    });
    const tagSlugs = getAllSlugsFromLocaleThatContainsWord({
      language,
      locales: "tags",
      word,
    });
    const eventTargetGroupSlugs = getAllSlugsFromLocaleThatContainsWord({
      language,
      locales: "eventTargetGroups",
      word,
    });
    const experienceLevelSlugs = getAllSlugsFromLocaleThatContainsWord({
      language,
      locales: "experienceLevels",
      word,
    });
    const stageSlugs = getAllSlugsFromLocaleThatContainsWord({
      language,
      locales: "stages",
      word,
    });

    const contains: {
      OR: {
        AND: (
          | {
              [K in Event as string]: {
                contains: string;
                mode: Prisma.QueryMode;
              };
            }
          | {
              [K in "types" | "focuses" | "tags" | "eventTargetGroups"]?: {
                some: {
                  [K in "eventType" | "focus" | "tag" | "eventTargetGroup"]?: {
                    slug: {
                      in: string[];
                      mode: Prisma.QueryMode;
                    };
                  };
                };
              };
            }
          | {
              [K in "experienceLevel" | "stage"]?: {
                slug: {
                  in: string[];
                  mode: Prisma.QueryMode;
                };
              };
            }
          | {
              [K in "eventVisibility"]?: {
                [K in Event as string]: boolean;
              };
            }
        )[];
      }[];
    } = {
      OR: [
        {
          AND: [
            {
              name: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  eventVisibility: {
                    name: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              slug: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  eventVisibility: {
                    slug: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              description: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  eventVisibility: {
                    description: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              venueName: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  eventVisibility: {
                    venueName: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              venueStreet: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  eventVisibility: {
                    venueStreet: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              venueStreetNumber: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  eventVisibility: {
                    venueStreetNumber: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              venueCity: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  eventVisibility: {
                    venueCity: true,
                  },
                }
              : {},
          ],
        },
        {
          AND: [
            {
              subline: {
                contains: word,
                mode: "insensitive",
              },
            },
            isLoggedIn === false
              ? {
                  eventVisibility: {
                    subline: true,
                  },
                }
              : {},
          ],
        },
        {
          AND:
            eventTypeSlugs.length > 0
              ? [
                  {
                    types: {
                      some: {
                        eventType: {
                          slug: {
                            in: eventTypeSlugs,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  isLoggedIn === false
                    ? {
                        eventVisibility: {
                          types: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            experienceLevelSlugs.length > 0
              ? [
                  {
                    experienceLevel: {
                      slug: {
                        in: experienceLevelSlugs,
                        mode: "insensitive",
                      },
                    },
                  },
                  isLoggedIn === false
                    ? {
                        eventVisibility: {
                          experienceLevel: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            stageSlugs.length > 0
              ? [
                  {
                    stage: {
                      slug: {
                        in: stageSlugs,
                        mode: "insensitive",
                      },
                    },
                  },
                  isLoggedIn === false
                    ? {
                        eventVisibility: {
                          stage: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            focusSlugs.length > 0
              ? [
                  {
                    focuses: {
                      some: {
                        focus: {
                          slug: {
                            in: focusSlugs,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  isLoggedIn === false
                    ? {
                        eventVisibility: {
                          focuses: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            tagSlugs.length > 0
              ? [
                  {
                    tags: {
                      some: {
                        tag: {
                          slug: {
                            in: tagSlugs,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  isLoggedIn === false
                    ? {
                        eventVisibility: {
                          tags: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
        {
          AND:
            eventTargetGroupSlugs.length > 0
              ? [
                  {
                    eventTargetGroups: {
                      some: {
                        eventTargetGroup: {
                          slug: {
                            in: eventTargetGroupSlugs,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                  isLoggedIn === false
                    ? {
                        eventVisibility: {
                          targetGroups: true,
                        },
                      }
                    : {},
                ]
              : [],
        },
      ],
    };
    whereClauses.push(contains);
  }
  return whereClauses;
}

export async function getEventIds(options: {
  filter: GetEventsSchema["evtFilter"];
  search: GetSearchSchema["search"];
  isLoggedIn: boolean;
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
}) {
  const whereClauses = getEventsFilterWhereClause(options.filter);

  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    const filterValues = options.filter[typedFilterKey];
    if (filterValues.length === 0) {
      continue;
    }
    if (options.isLoggedIn === false) {
      const visibilityWhereStatement = {
        eventVisibility: {
          [`${
            typedFilterKey === "periodOfTime"
              ? "startTime"
              : typedFilterKey === "stage"
              ? "stage"
              : `${typedFilterKey}${typedFilterKey === "focus" ? "es" : "s"}`
          }`]: true,
        },
      };
      whereClauses.AND.push(visibilityWhereStatement);
    }
  }

  const searchWhereClauses = getEventsSearchWhereClause(
    options.search,
    options.isLoggedIn,
    options.language
  );

  whereClauses.AND.push(...searchWhereClauses);

  const events = await prismaClient.event.findMany({
    where: {
      AND: [...whereClauses.AND, { published: true }],
    },
    select: {
      id: true,
    },
  });

  const ids = events.map((event) => {
    return event.id;
  });

  return ids;
}

export async function getAllEvents(options: {
  filter: GetEventsSchema["evtFilter"];
  sortBy: GetEventsSchema["evtSortBy"];
  take: ReturnType<typeof getTakeParam>;
  eventIds: string[];
}) {
  const events = await prismaClient.event.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentEventId: true,
      startTime: true,
      endTime: true,
      participationUntil: true,
      participationFrom: true,
      participantLimit: true,
      background: true,
      published: true,
      stage: {
        select: {
          slug: true,
        },
      },
      canceled: true,
      subline: true,
      description: true,
      _count: {
        select: {
          childEvents: true,
          participants: true,
          responsibleOrganizations: true,
          waitingList: true,
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              organizationVisibility: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logo: true,
                },
              },
            },
          },
        },
      },
      eventVisibility: {
        select: {
          id: true,
          name: true,
          slug: true,
          parentEventId: true,
          startTime: true,
          endTime: true,
          participationUntil: true,
          participationFrom: true,
          participantLimit: true,
          background: true,
          published: true,
          stage: true,
          canceled: true,
          subline: true,
          description: true,
          responsibleOrganizations: true,
        },
      },
    },
    where: {
      id: {
        in: options.eventIds,
      },
    },
    orderBy: [
      options.filter.periodOfTime === "past" &&
      options.sortBy.split("-")[0] === "startTime"
        ? {
            [options.sortBy.split("-")[0]]: "desc",
          }
        : {
            [options.sortBy.split("-")[0]]: options.sortBy.split("-")[1],
          },
      {
        id: "asc",
      },
    ],
    take: options.take,
  });

  return events;
}

export async function enhanceEventsWithParticipationStatus(
  sessionUser: User | null,
  events: Array<
    ArrayElement<Awaited<ReturnType<typeof getAllEvents>>> & {
      blurredBackground: string | undefined;
    }
  >
) {
  if (sessionUser === null) {
    const enhancedEvents = events.map((item) => {
      const isParticipant = false;
      const isOnWaitingList = false;
      const isSpeaker = false;
      const isTeamMember = false;

      return {
        ...item,
        isParticipant,
        isOnWaitingList,
        isSpeaker,
        isTeamMember,
      };
    });
    return enhancedEvents;
  } else {
    const eventIdsWhereParticipant = (
      await prismaClient.participantOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereOnWaitingList = (
      await prismaClient.waitingParticipantOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereSpeaker = (
      await prismaClient.speakerOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereTeamMember = (
      await prismaClient.teamMemberOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);

    const enhancedEvents = events.map((item) => {
      const isParticipant = eventIdsWhereParticipant.includes(item.id);
      const isOnWaitingList = eventIdsWhereOnWaitingList.includes(item.id);
      const isSpeaker = eventIdsWhereSpeaker.includes(item.id);
      const isTeamMember = eventIdsWhereTeamMember.includes(item.id);

      return {
        ...item,
        isParticipant,
        isOnWaitingList,
        isSpeaker,
        isTeamMember,
      };
    });
    return enhancedEvents;
  }
}

// TODO: Where statement in raw sql for periodOfTime
export async function getEventFilterVectorForAttribute(options: {
  attribute: keyof GetEventsSchema["evtFilter"];
  filter: GetEventsSchema["evtFilter"];
  search: GetSearchSchema["search"];
  ids: string[];
}) {
  const { attribute, filter, ids } = options;
  const whereStatements = ["published = true"];
  for (const filterKey in filter) {
    const typedFilterKey = filterKey as keyof typeof filter;

    if (typedFilterKey === attribute) {
      continue;
    }

    const fieldWhereStatements: string[] = [];

    if (typedFilterKey === "periodOfTime") {
      const filterValue = filter[typedFilterKey];

      const filterWhereStatement = getWhereStatementFromPeriodOfTime(
        filterValue,
        "raw"
      );
      // I had to do this because typescript can't resolve the correct return type of getWhereStatementFromPeriodOfTime()
      invariantResponse(
        typeof filterWhereStatement === "string",
        "Please provide raw sql syntax",
        { status: 500 }
      );
      whereStatements.push(filterWhereStatement);
    } else if (typedFilterKey === "stage") {
      const filterValue = filter[typedFilterKey];
      if (typeof filterValue === "string" && filterValue !== "all") {
        const allPossibleStages = await prismaClient.stage.findMany({
          select: {
            slug: true,
          },
        });
        invariantResponse(
          allPossibleStages.some((value) => {
            return value.slug === filterValue;
          }),
          "Cannot filter by the specified slug.",
          { status: 400 }
        );
        const tuple = `${typedFilterKey}\\:${filterValue}`;
        const whereStatement = `filter_vector @@ '${tuple}'::tsquery`;
        fieldWhereStatements.push(whereStatement);
      }
    } else {
      // TODO: Union type issue when we add another filter key. Reason is shown below. The select statement can have different signatures because of the relations.
      /* Example:
          const test = await prismaClient.eventType.findMany({
            select: {
              slug: true,
              events: {
                select: {
                  eventId: true,
                },
              },
            },
          });
          const test2 = await prismaClient.area.findMany({
            select: {
              slug: true,
              events: {
                select: {
                  areaId: true,
                },
              },
            },
          });
          */
      // Further reading:
      // https://www.prisma.io/docs/orm/prisma-schema/data-model/table-inheritance#union-types
      // https://github.com/prisma/prisma/issues/2505

      // I worked arround with an assertion. But if any table except eventTypes remove their slug, this will break and typescript will not warn us.
      const fakeTypedFilterKey = filterKey as "eventType";
      let allPossibleFilterValues;
      try {
        allPossibleFilterValues = await prismaClient[
          fakeTypedFilterKey
        ].findMany({
          select: {
            slug: true,
          },
        });
        // TODO: fix type issue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error({ error });
        invariantResponse(false, "Server error", { status: 500 });
      }
      const filterValues = filter[typedFilterKey];

      for (const slug of filterValues) {
        // Validate slug because of queryRawUnsafe
        invariantResponse(
          allPossibleFilterValues.some((value) => {
            return value.slug === slug;
          }),
          "Cannot filter by the specified slug.",
          { status: 400 }
        );
        const tuple = `${typedFilterKey}\\:${slug}`;
        const whereStatement = `filter_vector @@ '${tuple}'::tsquery`;
        fieldWhereStatements.push(whereStatement);
      }
    }

    if (fieldWhereStatements.length > 0) {
      whereStatements.push(`(${fieldWhereStatements.join(" OR ")})`);
    }
  }

  if (ids.length > 0 && options.search.length > 0) {
    whereStatements.push(`id IN (${ids.map((id) => `'${id}'`).join(", ")})`);
  }

  // Special case: if no profiles are found, but search isn't
  if (ids.length === 0 && options.search.length > 0) {
    whereStatements.push("id IN ('some-random-event-id')");
  }

  const whereClause = `WHERE ${whereStatements.join(" AND ")}`;

  const filterVector: {
    attr: keyof typeof filter;
    value: string[];
    count: number[];
  }[] = await prismaClient.$queryRawUnsafe(`
      SELECT
        split_part(word, ':', 1) AS attr,
        array_agg(split_part(word, ':', 2)) AS value,
        array_agg(ndoc) AS count
      FROM ts_stat($$
        SELECT filter_vector
        FROM events
        ${whereClause}
      $$)
      GROUP BY attr;
      `);

  return filterVector;
}

export function getFilterCountForSlug(
  // TODO: Remove '| null' when slug isn't optional anymore (after migration)
  slug: string | null,
  filterVector: Awaited<ReturnType<typeof getEventFilterVectorForAttribute>>,
  attribute: ArrayElement<
    Awaited<ReturnType<typeof getEventFilterVectorForAttribute>>
  >["attr"]
) {
  const filterKeyVector = filterVector.find((vector) => {
    return vector.attr === attribute;
  });

  if (typeof filterKeyVector === "undefined") {
    return 0;
  }

  // TODO: Remove '|| ""' when slug isn't optional anymore (after migration)
  const valueIndex = filterKeyVector.value.indexOf(slug || "");
  if (valueIndex === -1) {
    return 0;
  }

  const filterCount = filterKeyVector.count[valueIndex];

  return filterCount;
}

export async function getAllStages() {
  return await prismaClient.stage.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });
}

export async function getAllFocuses() {
  return await prismaClient.focus.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });
}

export async function getAllEventTargetGroups() {
  return await prismaClient.eventTargetGroup.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      slug: true,
    },
  });
}
