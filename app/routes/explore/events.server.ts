import { json } from "@remix-run/server-runtime";
import { type User } from "@supabase/supabase-js";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma.server";
import { type GetEventsSchema } from "./events";

export function getTakeParam(page: GetEventsSchema["page"]) {
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
  periodOfTime: GetEventsSchema["filter"]["periodOfTime"],
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

export async function getVisibilityFilteredEventsCount(options: {
  filter: GetEventsSchema["filter"];
}) {
  const whereClauses = [];
  const visibilityWhereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    if (typedFilterKey === "periodOfTime") {
      const filterValue = options.filter[typedFilterKey];
      const filterWhereStatement =
        getWhereStatementFromPeriodOfTime(filterValue);
      // I had to do this because typescript can't resolve the correct return type of getWhereStatementFromPeriodOfTime()
      invariantResponse(
        typeof filterWhereStatement !== "string",
        "Please provide prisma sql syntax",
        { status: 500 }
      );
      whereClauses.push(filterWhereStatement);
    } else if (typedFilterKey === "stage") {
      const filterValue = options.filter[typedFilterKey];
      if (typeof filterValue === "string" && filterValue !== "all") {
        const filterWhereStatement = {
          stage: {
            slug: filterValue,
          },
        };
        whereClauses.push(filterWhereStatement);
      }
    } else {
      const filterValues = options.filter[typedFilterKey];
      if (filterValues.length === 0) {
        continue;
      }
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
        whereClauses.push(filterWhereStatement);
      }
    }

    const visibilityWhereStatement = {
      eventVisibility: {
        [`${
          typedFilterKey === "periodOfTime"
            ? "startTime"
            : typedFilterKey === "stage"
            ? "stage"
            : `${typedFilterKey}${typedFilterKey === "focus" ? "es" : "s"}`
        }`]: false,
      },
    };
    visibilityWhereClauses.push(visibilityWhereStatement);
  }
  if (visibilityWhereClauses.length === 0) {
    return 0;
  }
  whereClauses.push({ OR: [...visibilityWhereClauses] });

  const count = await prismaClient.event.count({
    where: {
      AND: [...whereClauses, { published: true }],
    },
  });

  return count;
}

export async function getEventsCount(options: {
  filter: GetEventsSchema["filter"];
}) {
  const whereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;

    if (typedFilterKey === "periodOfTime") {
      const filterValue = options.filter[typedFilterKey];
      const filterWhereStatement =
        getWhereStatementFromPeriodOfTime(filterValue);
      // I had to do this because typescript can't resolve the correct return type of getWhereStatementFromPeriodOfTime()
      invariantResponse(
        typeof filterWhereStatement !== "string",
        "Please provide prisma sql syntax",
        { status: 500 }
      );
      whereClauses.push(filterWhereStatement);
    } else if (typedFilterKey === "stage") {
      const filterValue = options.filter[typedFilterKey];
      if (typeof filterValue === "string" && filterValue !== "all") {
        const filterWhereStatement = {
          stage: {
            slug: filterValue,
          },
        };
        whereClauses.push(filterWhereStatement);
      }
    } else {
      const filterValues = options.filter[typedFilterKey];
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
        whereClauses.push(filterWhereStatement);
      }
    }
  }

  const count = await prismaClient.event.count({
    where: {
      AND: [...whereClauses, { published: true }],
    },
  });

  return count;
}

export async function getAllEvents(options: {
  filter: GetEventsSchema["filter"];
  sortBy: GetEventsSchema["sortBy"];
  take: ReturnType<typeof getTakeParam>;
  isLoggedIn: boolean;
}) {
  const whereClauses = [];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;
    if (typedFilterKey === "periodOfTime") {
      const filterValue = options.filter[typedFilterKey];
      const filterWhereStatement =
        getWhereStatementFromPeriodOfTime(filterValue);
      // I had to do this because typescript can't resolve the correct return type of getWhereStatementFromPeriodOfTime()
      invariantResponse(
        typeof filterWhereStatement !== "string",
        "Please provide prisma sql syntax",
        { status: 500 }
      );
      whereClauses.push(filterWhereStatement);
    } else if (typedFilterKey === "stage") {
      const filterValue = options.filter[typedFilterKey];
      if (typeof filterValue === "string" && filterValue !== "all") {
        const filterWhereStatement = {
          stage: {
            slug: filterValue,
          },
        };
        whereClauses.push(filterWhereStatement);
      }
    } else {
      const filterValues = options.filter[typedFilterKey];
      if (filterValues.length === 0) {
        continue;
      }
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
        whereClauses.push(filterWhereStatement);
      }
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
      whereClauses.push(visibilityWhereStatement);
    }
  }

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
          title: true,
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
      AND: [...whereClauses, { published: true }],
    },
    orderBy:
      options.filter.periodOfTime === "past" &&
      options.sortBy.value === "startTime"
        ? {
            [options.sortBy.value]: "desc",
          }
        : {
            [options.sortBy.value]: options.sortBy.direction,
          },
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
export async function getEventFilterVector(options: {
  filter: GetEventsSchema["filter"];
}) {
  const whereStatements = ["published = true"];
  for (const filterKey in options.filter) {
    const typedFilterKey = filterKey as keyof typeof options.filter;

    if (typedFilterKey === "periodOfTime") {
      const filterValue = options.filter[typedFilterKey];
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
      const filterValue = options.filter[typedFilterKey];
      if (typeof filterValue === "string" && filterValue !== "all") {
        const tuple = `${typedFilterKey}\\:${filterValue}`;
        const whereStatement = `filter_vector @@ '${tuple}'::tsquery`;
        whereStatements.push(whereStatement);
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
      } catch (error: any) {
        throw json({ message: "Server error" }, { status: 500 });
      }
      const filterValues = options.filter[typedFilterKey];
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
        whereStatements.push(whereStatement);
      }
    }
  }
  const whereClause = `WHERE ${whereStatements.join(" AND ")}`;

  const filterVector: {
    attr: keyof typeof options.filter;
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
  filterVector: Awaited<ReturnType<typeof getEventFilterVector>>,
  attribute: ArrayElement<
    Awaited<ReturnType<typeof getEventFilterVector>>
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

export async function getAllEventTypes() {
  return await prismaClient.eventType.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
    },
  });
}

export async function getAllStages() {
  return await prismaClient.stage.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      title: true,
      description: true,
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
      title: true,
      description: true,
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
      title: true,
      description: true,
      slug: true,
    },
  });
}
