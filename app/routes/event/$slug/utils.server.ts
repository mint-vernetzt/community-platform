import { Event } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { badRequest, notFound } from "remix-utils";
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
