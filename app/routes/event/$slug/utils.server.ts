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

export async function getEventBySlug(
  slug: string,
  options: { throw: boolean } = { throw: false }
) {
  const event = await prismaClient.event.findFirst({ where: { slug } });
  if (event === null && options.throw === true) {
    throw notFound({ message: "Event not found" });
  }
  return event;
}

export async function getEventBySlugOrThrow(slug: string) {
  return (await getEventBySlug(slug, { throw: true })) as Event;
}
