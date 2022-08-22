import { Event } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { notFound } from "remix-utils";
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

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findFirst({
    where: { slug },
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
    },
  });
  return event;
}

export async function getEventBySlugOrThrow(slug: string) {
  const result = await getEventBySlug(slug);
  if (result === null) {
    throw notFound({ message: "Event not found" });
  }
  return result;
}
