import { Event } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { badRequest, notFound } from "remix-utils";
import { ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma";

type Mode = "anon" | "authenticated" | "owner";
export async function deriveMode(
  event: Event,
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
    const result = await prismaClient.$queryRaw`
      WITH RECURSIVE get_full_depth AS (
          SELECT id, parent_event_id, name
          FROM "events"
          WHERE id = ${id}
        UNION
          SELECT "events".id, "events".parent_event_id, "events".name
          FROM "events"
            JOIN get_full_depth
            ON "events".parent_event_id = get_full_depth.id
      )
        SELECT DISTINCT username, first_name, last_name, avatar, academic_title, position
        FROM "profiles"
          JOIN "participants_of_events"
          ON "profiles".id = "participants_of_events".profile_id
          JOIN get_full_depth
          ON "participants_of_events".event_id = get_full_depth.id
      ;`;

    console.log(result);

    return result as Pick<
      Event,
      "id" | "parentEventId" | "name" | "slug" | "published"
    >[];
  } catch (e) {
    console.error(e);
    return null;
  }
}
