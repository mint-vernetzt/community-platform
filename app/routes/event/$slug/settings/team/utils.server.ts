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
