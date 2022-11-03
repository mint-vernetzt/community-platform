import { Organization, Profile } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { badRequest, notFound } from "remix-utils";
import { prismaClient } from "~/prisma";

type Mode = "anon" | "authenticated" | "owner";
export async function deriveMode(
  event: NonNullable<Awaited<ReturnType<typeof getEvent>>>,
  currentUser: User | null
): Promise<Mode> {
  if (currentUser === null) {
    return "anon";
  }

  const relation = await prismaClient.teamMemberOfEvent.findFirst({
    where: {
      eventId: event.id,
      profileId: currentUser.id,
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
        },
      },
      childEvents: {
        select: {
          id: true,
          name: true,
          slug: true,
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
            },
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
            },
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
            },
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
            },
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

export async function getFullDepthParticipants(id: string) {
  try {
    // Get event and all child events of arbitrary depth with raw query
    // Join the result with relevant relation tables
    const result: Pick<
      Profile,
      | "id"
      | "academicTitle"
      | "firstName"
      | "lastName"
      | "username"
      | "email"
      | "avatar"
      | "position"
    >[] = await prismaClient.$queryRaw`
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
        SELECT DISTINCT profile_id as id, first_name as "firstName", last_name as "lastName", username, email, position, avatar, academic_title as academicTitle
        FROM "profiles"
          JOIN "participants_of_events"
          ON "profiles".id = "participants_of_events".profile_id
          JOIN get_full_depth
          ON "participants_of_events".event_id = get_full_depth.id
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

export async function getFullDepthWaitingList(id: string) {
  try {
    // Get event and all child events of arbitrary depth with raw query
    // Join the result with relevant relation tables
    const result: Pick<
      Profile,
      | "id"
      | "academicTitle"
      | "firstName"
      | "lastName"
      | "username"
      | "email"
      | "avatar"
      | "position"
    >[] = await prismaClient.$queryRaw`
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
        SELECT DISTINCT profile_id as id, first_name as "firstName", last_name as "lastName", username, email, position, avatar, academic_title as academicTitle
        FROM "profiles"
          JOIN "waiting_participants_of_events"
          ON "profiles".id = "waiting_participants_of_events".profile_id
          JOIN get_full_depth
          ON "waiting_participants_of_events".event_id = get_full_depth.id
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

export async function getFullDepthSpeakers(id: string) {
  try {
    // Get event and all child events of arbitrary depth with raw query
    // Join the result with relevant relation tables
    const result: Pick<
      Profile,
      | "id"
      | "academicTitle"
      | "firstName"
      | "lastName"
      | "username"
      | "email"
      | "avatar"
      | "position"
    >[] = await prismaClient.$queryRaw`
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
        SELECT DISTINCT profile_id as id, first_name as "firstName", last_name as "lastName", username, email, position, avatar, academic_title as academicTitle
        FROM "profiles"
          JOIN "speakers_of_events"
          ON "profiles".id = "speakers_of_events".profile_id
          JOIN get_full_depth
          ON "speakers_of_events".event_id = get_full_depth.id
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

export async function getFullDepthOrganizers(id: string) {
  try {
    // Get event and all child events of arbitrary depth with raw query
    // Join the result with relevant relation tables
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
        SELECT DISTINCT name, slug
        FROM "organizations"
          JOIN "responsible_organizations_of_events"
          ON "organizations".id = "responsible_organizations_of_events".organization_id
          JOIN get_full_depth
          ON "responsible_organizations_of_events".event_id = get_full_depth.id
      ;`;

    return result as Pick<Organization, "slug" | "name">[];
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
        ReturnType<
          typeof getEventParticipants | typeof getFullDepthParticipants
        >
      >;
    } & {
      speakers: Awaited<
        ReturnType<typeof getEventSpeakers | typeof getFullDepthSpeakers>
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
          title: true,
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
  });
  return result;
}

export async function enhanceChildEventsWithParticipationStatus(
  currentUserId: string,
  event: Awaited<ReturnType<typeof getEvent>> & {
    participants: Awaited<
      ReturnType<typeof getEventParticipants | typeof getFullDepthParticipants>
    >;
  } & {
    speakers: Awaited<
      ReturnType<typeof getEventSpeakers | typeof getFullDepthSpeakers>
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
