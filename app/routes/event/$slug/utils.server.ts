import { Prisma } from "@prisma/client";
import type { Organization, Profile } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { badRequest, notFound } from "remix-utils";
import { prismaClient } from "~/prisma";

type Mode = "anon" | "authenticated" | "owner";

export async function deriveMode(
  event: NonNullable<Awaited<ReturnType<typeof getEvent>>>,
  sessionUser: User | null
): Promise<Mode> {
  if (sessionUser === null) {
    return "anon";
  }

  const relation = await prismaClient.teamMemberOfEvent.findFirst({
    where: {
      eventId: event.id,
      profileId: sessionUser.id,
    },
  });

  if (relation === null || relation.isPrivileged === false) {
    return "authenticated";
  }

  return "owner";
}

export async function getEventByField(field: string, value: string) {
  const event = await prismaClient.event.findFirst({
    where: { [field]: value },
    include: {
      targetGroups: {
        select: {
          targetGroupId: true,
          targetGroup: {
            select: {
              title: true,
            },
          },
        },
      },
      types: {
        select: {
          eventTypeId: true,
          eventType: {
            select: {
              title: true,
            },
          },
        },
      },
      tags: {
        select: {
          tagId: true,
          tag: {
            select: {
              title: true,
            },
          },
        },
      },
      experienceLevel: {
        select: {
          id: true,
          title: true,
        },
      },
      stage: {
        select: {
          id: true,
          title: true,
        },
      },
      areas: {
        select: {
          areaId: true,
          area: {
            select: {
              name: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focusId: true,
          focus: {
            select: {
              title: true,
            },
          },
        },
      },
      parentEvent: {
        select: {
          id: true,
          name: true,
          slug: true,
          startTime: true,
          endTime: true,
          background: true,
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
          participantLimit: true,
          subline: true,
          description: true,
        },
      },
      childEvents: {
        select: {
          id: true,
          name: true,
          slug: true,
          startTime: true,
          endTime: true,
          background: true,
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
          participantLimit: true,
          subline: true,
          description: true,
        },
      },
      teamMembers: {
        select: {
          isPrivileged: true,
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
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
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
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
      speakers: {
        select: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
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
      participants: {
        select: {
          createdAt: true,
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
              position: true,
              avatar: true,
              memberOf: {
                select: {
                  organization: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
      waitingList: {
        select: {
          createdAt: true,
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
              position: true,
              avatar: true,
              memberOf: {
                select: {
                  organization: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
      documents: {
        select: {
          document: {
            select: {
              id: true,
              filename: true,
              path: true,
              extension: true,
              sizeInMB: true,
              title: true,
              description: true,
            },
          },
        },
      },
      _count: {
        select: {
          childEvents: true,
          participants: true,
        },
      },
    },
  });
  return event;
}

export async function getEventBySlug(slug: string) {
  return await getEventByField("slug", slug);
}

export async function getEventBySlugOrThrow(slug: string) {
  const result = await getEventBySlug(slug);
  if (result === null) {
    throw notFound({ message: "Event not found" });
  }
  return result;
}

export async function getEventById(id: string) {
  return await getEventByField("id", id);
}

export async function getEventByIdOrThrow(id: string) {
  const result = await getEventById(id);
  if (result === null) {
    throw notFound({ message: "Event not found" });
  }
  return result;
}

export async function checkSameEventOrThrow(request: Request, eventId: string) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  const value = formData.get("eventId") as string | null;
  if (value === null || value !== eventId) {
    throw badRequest({ message: "Event IDs differ" });
  }
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
                  get_full_depth.name as "eventName", 
                  array_remove(array_agg(DISTINCT organizations.name), null) as "organizationNames"`;

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
      > & { email?: string; eventName?: string[]; organizationNames?: string[] }
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
      : Prisma.sql`SELECT "organizations".name, "events".name as "eventName"`;

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
      Pick<Organization, "slug" | "name"> & { eventName?: string }
    >;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export type MaybeEnhancedEvent =
  | (
      | Awaited<ReturnType<typeof getEvent>>
      | Awaited<ReturnType<typeof enhanceChildEventsWithParticipationStatus>>
    ) & {
      participants: Awaited<
        ReturnType<typeof getEventParticipants | typeof getFullDepthProfiles>
      >;
    } & {
      speakers: Awaited<
        ReturnType<typeof getEventSpeakers | typeof getFullDepthProfiles>
      >;
    };

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
      stage: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      canceled: true,

      parentEvent: {
        select: {
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
      participationUntil: true,
      participationFrom: true,
      participantLimit: true,
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
      description: true,
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
          stage: {
            select: {
              title: true,
            },
          },
          canceled: true,
          published: true,
          subline: true,
          participationUntil: true,
          participationFrom: true,

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
  currentUserId: string,
  event: Awaited<ReturnType<typeof getEvent>> & {
    participants: Awaited<
      ReturnType<typeof getEventParticipants | typeof getFullDepthProfiles>
    >;
  } & {
    speakers: Awaited<
      ReturnType<typeof getEventSpeakers | typeof getFullDepthProfiles>
    >;
  }
) {
  const eventIdsWhereParticipant = (
    await prismaClient.participantOfEvent.findMany({
      where: {
        profileId: currentUserId,
      },
      select: {
        eventId: true,
      },
    })
  ).map((event) => event.eventId);
  const eventIdsWhereOnWaitingList = (
    await prismaClient.waitingParticipantOfEvent.findMany({
      where: {
        profileId: currentUserId,
      },
      select: {
        eventId: true,
      },
    })
  ).map((event) => event.eventId);
  const eventIdsWhereSpeaker = (
    await prismaClient.speakerOfEvent.findMany({
      where: {
        profileId: currentUserId,
      },
      select: {
        eventId: true,
      },
    })
  ).map((event) => event.eventId);
  const eventIdsWhereTeamMember = (
    await prismaClient.teamMemberOfEvent.findMany({
      where: {
        profileId: currentUserId,
      },
      select: {
        eventId: true,
      },
    })
  ).map((event) => event.eventId);

  const enhancedChildEvents = event.childEvents.map((childEvent) => {
    const isParticipant = eventIdsWhereParticipant.includes(childEvent.id);
    const isOnWaitingList = eventIdsWhereOnWaitingList.includes(childEvent.id);
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
  return { ...event, childEvents: enhancedChildEvents };
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
