import type { Organization, Profile } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { notFound } from "remix-utils";
import { prismaClient } from "~/prisma.server";
import type { ArrayElement } from "~/lib/utils/types";

export async function getEventVisibilitiesBySlugOrThrow(slug: string) {
  const result = await prismaClient.eventVisibility.findFirst({
    where: {
      event: {
        slug,
      },
    },
  });
  if (result === null) {
    throw notFound({ message: "Event visbilities not found." });
  }
  return result;
}

export async function getFullDepthProfiles(
  eventId: string,
  relation: "participants" | "waitingList" | "speakers",
  groupBy: "profiles" | "events" = "profiles"
) {
  try {
    // Get event and all child events of arbitrary depth with raw query
    // Join the result with relevant relation tables
    const select =
      groupBy === "profiles"
        ? Prisma.sql`SELECT 
                  profiles.id, 
                  first_name as "firstName", 
                  last_name as "lastName", 
                  username, 
                  position, 
                  avatar, 
                  academic_title as "academicTitle"`
        : Prisma.sql`SELECT 
                  profiles.id, 
                  first_name as "firstName", 
                  last_name as "lastName", 
                  username, 
                  profiles.email, 
                  position, 
                  avatar, 
                  academic_title as "academicTitle", 
                  get_full_depth.name as "participatedEvents", 
                  array_remove(array_agg(DISTINCT organizations.name), null) as "memberOf"`;

    const profileJoin =
      relation === "participants"
        ? Prisma.sql`JOIN "participants_of_events"
                    ON get_full_depth.id = "participants_of_events".event_id
                    JOIN "profiles"
                    ON "profiles".id = "participants_of_events".profile_id`
        : relation === "waitingList"
        ? Prisma.sql`JOIN "waiting_participants_of_events"
                    ON get_full_depth.id = "waiting_participants_of_events".event_id
                    JOIN "profiles"
                    ON "profiles".id = "waiting_participants_of_events".profile_id`
        : Prisma.sql`JOIN "speakers_of_events"
                    ON get_full_depth.id = "speakers_of_events".event_id
                    JOIN "profiles"
                    ON "profiles".id = "speakers_of_events".profile_id`;

    const organizationJoin =
      groupBy === "profiles"
        ? Prisma.empty
        : Prisma.sql`LEFT JOIN "members_of_organizations"
                    ON "profiles".id = "members_of_organizations"."profileId"
                    LEFT JOIN "organizations"
                    ON "organizations".id = "members_of_organizations"."organizationId"`;

    const groupByClause =
      groupBy === "profiles"
        ? Prisma.sql`GROUP BY profiles.id`
        : Prisma.sql`GROUP BY get_full_depth.name, profiles.id`;

    const result: Array<
      Pick<
        Profile,
        | "id"
        | "academicTitle"
        | "firstName"
        | "lastName"
        | "username"
        | "avatar"
        | "position"
      > & { email?: string; participatedEvents?: string; memberOf?: string[] }
    > = await prismaClient.$queryRaw`
      WITH RECURSIVE get_full_depth AS (
          SELECT id, parent_event_id, name
          FROM "events"
          WHERE id = ${eventId}
        UNION
          SELECT "events".id, "events".parent_event_id, "events".name
          FROM "events"
            JOIN get_full_depth
            ON "events".parent_event_id = get_full_depth.id
      )
        ${select}
        FROM get_full_depth
          ${profileJoin}
          ${organizationJoin}
        ${groupByClause}
        ORDER BY first_name ASC
      ;`;

    const profiles = result.map((profile) => {
      return { profile };
    });
    return profiles;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// TODO: When this function gets used please optimize the query like the query in the above fullDepth functions (Selecting from get_full_depth and then joining towards organizations)
export async function getFullDepthOrganizers(
  id: string,
  selectDistinct = true
) {
  try {
    // Get event and all child events of arbitrary depth with raw query
    // Join the result with relevant relation tables
    const select = selectDistinct
      ? Prisma.sql`SELECT DISTINCT "organizations".name, slug`
      : Prisma.sql`SELECT "organizations".name, "events".name as "responsibleForEvents"`;

    const result = await prismaClient.$queryRaw`
      WITH RECURSIVE get_full_depth AS (
          SELECT id, parent_event_id
          FROM "events"
          WHERE id = ${id}
        UNION
          SELECT "events".id, "events".parent_event_id
          FROM "events"
            JOIN get_full_depth
            ON "events".parent_event_id = get_full_depth.id
      )
        ${select}
        FROM "organizations"
          JOIN "responsible_organizations_of_events"
          ON "organizations".id = "responsible_organizations_of_events".organization_id
          JOIN "events"
          ON "events".id = "responsible_organizations_of_events".event_id
          JOIN get_full_depth
          ON "responsible_organizations_of_events".event_id = get_full_depth.id
      ;`;

    return result as Array<
      Pick<Organization, "slug" | "name"> & { responsibleForEvents?: string }
    >;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getEvent(slug: string) {
  const result = await prismaClient.event.findFirst({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
      published: true,
      background: true,
      name: true,
      startTime: true,
      endTime: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      venueCity: true,
      conferenceLink: true,
      conferenceCode: true,
      subline: true,
      participationUntil: true,
      participationFrom: true,
      participantLimit: true,
      description: true,
      canceled: true,
      stage: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      parentEvent: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      areas: {
        select: {
          area: {
            select: {
              name: true,
            },
          },
        },
      },
      types: {
        select: {
          eventType: {
            select: {
              title: true,
            },
          },
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              title: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              title: true,
            },
          },
        },
      },
      targetGroups: {
        select: {
          targetGroup: {
            select: {
              title: true,
            },
          },
        },
      },
      experienceLevel: {
        select: {
          title: true,
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          organization: {
            name: "asc",
          },
        },
      },
      teamMembers: {
        select: {
          profile: {
            select: {
              id: true,
              academicTitle: true,
              firstName: true,
              lastName: true,
              avatar: true,
              username: true,
              position: true,
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
      childEvents: {
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          startTime: true,
          endTime: true,
          background: true,
          participantLimit: true,
          canceled: true,
          published: true,
          subline: true,
          participationUntil: true,
          participationFrom: true,
          stage: {
            select: {
              title: true,
            },
          },
          _count: {
            select: {
              childEvents: true,
              participants: true,
              waitingList: true,
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      },
      documents: {
        select: {
          document: {
            select: {
              id: true,
              filename: true,
              title: true,
              description: true,
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
          childEvents: true,
        },
      },
    },
  });
  return result;
}

export async function getEventParticipants(currentEventId: string) {
  const result = await prismaClient.participantOfEvent.findMany({
    where: {
      eventId: currentEventId,
    },
    select: {
      profile: {
        select: {
          id: true,
          academicTitle: true,
          firstName: true,
          lastName: true,
          position: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      profile: {
        firstName: "asc",
      },
    },
  });
  return result;
}

export async function getEventSpeakers(currentEventId: string) {
  const result = await prismaClient.speakerOfEvent.findMany({
    where: {
      eventId: currentEventId,
    },
    select: {
      profile: {
        select: {
          id: true,
          academicTitle: true,
          firstName: true,
          lastName: true,
          position: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      profile: {
        firstName: "asc",
      },
    },
  });
  return result;
}

export async function enhanceChildEventsWithParticipationStatus(
  sessionUser: User | null,
  childEvents: Array<
    ArrayElement<
      Pick<
        NonNullable<Awaited<ReturnType<typeof getEvent>>>,
        "childEvents"
      >["childEvents"]
    > & { blurredChildBackground: string | undefined }
  >
) {
  if (sessionUser === null) {
    const enhancedChildEvents = childEvents.map((childEvent) => {
      const isParticipant = false;
      const isOnWaitingList = false;
      const isSpeaker = false;
      const isTeamMember = false;
      return {
        ...childEvent,
        isParticipant,
        isOnWaitingList,
        isSpeaker,
        isTeamMember,
      };
    });
    return enhancedChildEvents;
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

    const enhancedChildEvents = childEvents.map((childEvent) => {
      const isParticipant = eventIdsWhereParticipant.includes(childEvent.id);
      const isOnWaitingList = eventIdsWhereOnWaitingList.includes(
        childEvent.id
      );
      const isSpeaker = eventIdsWhereSpeaker.includes(childEvent.id);
      const isTeamMember = eventIdsWhereTeamMember.includes(childEvent.id);
      return {
        ...childEvent,
        isParticipant,
        isOnWaitingList,
        isSpeaker,
        isTeamMember,
      };
    });
    return enhancedChildEvents;
  }
}

export async function getIsParticipant(eventId: string, profileId?: string) {
  if (profileId === undefined) {
    return false;
  }
  const result = await prismaClient.participantOfEvent.findFirst({
    where: {
      eventId,
      profileId,
    },
  });
  return result !== null;
}

export async function getIsOnWaitingList(eventId: string, profileId?: string) {
  if (profileId === undefined) {
    return false;
  }
  const result = await prismaClient.waitingParticipantOfEvent.findFirst({
    where: {
      eventId,
      profileId,
    },
  });
  return result !== null;
}

export async function getIsSpeaker(eventId: string, profileId?: string) {
  if (profileId === undefined) {
    return false;
  }
  const result = await prismaClient.speakerOfEvent.findFirst({
    where: {
      eventId,
      profileId,
    },
  });
  return result !== null;
}

export async function getIsTeamMember(eventId: string, profileId?: string) {
  if (profileId === undefined) {
    return false;
  }
  const result = await prismaClient.teamMemberOfEvent.findFirst({
    where: {
      eventId,
      profileId,
    },
  });
  return result !== null;
}
