import { prismaClient } from "~/prisma";

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
