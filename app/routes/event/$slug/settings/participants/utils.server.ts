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

export async function disconnectParticipantFromEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.participantOfEvent.delete({
    where: {
      profileId_eventId: {
        eventId,
        profileId,
      },
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

export async function getNumberOfParticipants(eventId: string) {
  const number = await prismaClient.participantOfEvent.count({
    where: {
      eventId,
    },
  });
  return number;
}

export async function updateParticipantLimit(
  eventId: string,
  participantLimit: number | undefined
) {
  await prismaClient.event.update({
    where: { id: eventId },
    data: { updatedAt: new Date(), participantLimit },
  });
}
