import { Event } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { unauthorized } from "remix-utils";
import { prismaClient } from "~/prisma";

export async function checkOwnership(
  event: Event,
  currentUser: User | null,
  options: {
    throw: boolean;
  } = { throw: false }
) {
  let isOwner = false;
  if (currentUser !== null) {
    const relation = await prismaClient.teamMemberOfEvent.findFirst({
      where: {
        eventId: event.id,
        profileId: currentUser.id,
        isPrivileged: true,
      },
    });
    if (relation !== null) {
      isOwner = true;
    }
  }

  if (isOwner === false && options.throw) {
    throw unauthorized({ message: "Not authorized" });
  }

  return { isOwner };
}

export async function checkOwnershipOrThrow(
  event: Event,
  currentUser: User | null
) {
  return await checkOwnership(event, currentUser, { throw: true });
}
