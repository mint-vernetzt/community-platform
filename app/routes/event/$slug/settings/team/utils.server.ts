import { prismaClient } from "~/prisma";

export async function connectProfileToEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.teamMemberOfEvent.create({
    data: {
      eventId,
      profileId,
    },
  });
}

export async function disconnectProfileFromEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.teamMemberOfEvent.delete({
    where: {
      eventId_profileId: {
        eventId,
        profileId,
      },
    },
  });
}
