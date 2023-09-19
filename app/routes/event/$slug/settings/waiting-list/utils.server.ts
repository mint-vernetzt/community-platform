import { prismaClient } from "~/prisma.server";

// QUESTION: Moving utils to event/$slug as it's used inside the detail page?

export async function connectParticipantToEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.participantOfEvent.create({
    data: {
      eventId,
      profileId,
    },
  });
}

export async function connectToWaitingListOfEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.waitingParticipantOfEvent.create({
    data: {
      eventId,
      profileId,
    },
  });
}

export async function disconnectFromWaitingListOfEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.waitingParticipantOfEvent.delete({
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
