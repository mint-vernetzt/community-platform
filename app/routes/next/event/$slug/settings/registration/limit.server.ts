import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      participantLimit: true,
      moveUpToParticipants: true,
    },
  });
  return event;
}

export async function getEventIdBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
    },
  });
  if (event === null) {
    return null;
  }
  return event.id;
}

export async function updateEventMoveUpToParticipants(options: {
  eventId: string;
  moveUpToParticipants: boolean;
}) {
  const updatedEvent = await prismaClient.event.update({
    where: { id: options.eventId },
    data: {
      moveUpToParticipants: options.moveUpToParticipants,
    },
  });

  return updatedEvent;
}
