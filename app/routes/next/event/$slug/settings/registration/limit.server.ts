import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      participantLimit: true,
      moveUpToParticipants: true,
      external: true,
      openForRegistration: true,
      _count: {
        select: {
          participants: true,
        },
      },
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

export async function updateEventById(
  eventId: string,
  data: { participantLimit?: number | null; moveUpToParticipants?: boolean }
) {
  const updatedEvent = await prismaClient.event.update({
    where: { id: eventId },
    data,
  });

  return updatedEvent;
}
