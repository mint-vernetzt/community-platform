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

async function getEventWithChildEventsById(id: string) {
  const result = prismaClient.event.findFirst({
    where: { id },
    include: {
      childEvents: {
        include: {
          participants: true,
          speakers: true,
          responsibleOrganizations: true,
        },
      },
    },
  });
  return result;
}

export async function getFullDepthRelations(
  event: Pick<
    Awaited<ReturnType<typeof getEventBySlugOrThrow>>,
    "speakers" | "participants" | "responsibleOrganizations" | "id"
  >,
  fullDepthRelationKeys: Array<
    keyof Pick<
      typeof event,
      "speakers" | "participants" | "responsibleOrganizations"
    >
  >
) {
  let fullDepthRelations = {};
  fullDepthRelationKeys.map((key) => {
    // TODO: Fix type issue
    // @ts-ignore
    fullDepthRelations[key] = event[key];
    return null;
  });

  // TODO: recursive function

  const eventWithChilds = await getEventWithChildEventsById(event.id);

  while (eventWithChilds !== null && eventWithChilds.childEvents.length !== 0) {
    for (let childEvent of eventWithChilds.childEvents) {
      fullDepthRelationKeys.map((key) => {
        // TODO: Fix type issue
        // @ts-ignore
        fullDepthRelations[key] = [
          // TODO: Fix type issue
          // @ts-ignore
          ...fullDepthRelations[key],
          ...childEvent[key],
        ];
        return null;
      });
    }
  }
}
