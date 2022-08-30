import { prismaClient } from "~/prisma";

export async function connectSpeakerProfileToEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.speakerOfEvent.create({
    data: {
      eventId,
      profileId,
    },
  });
}
