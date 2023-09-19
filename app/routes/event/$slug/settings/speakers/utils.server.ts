import { prismaClient } from "~/prisma.server";

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

export async function disconnectSpeakerProfileFromEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.speakerOfEvent.delete({
    where: {
      profileId_eventId: {
        eventId,
        profileId,
      },
    },
  });
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}
