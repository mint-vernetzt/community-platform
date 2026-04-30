import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      participationFrom: true,
      participationUntil: true,
      createdAt: true,
    },
  });
  return event;
}

export async function updateEventRegistrationPeriod(options: {
  eventId: string;
  participationFrom: Date;
  participationUntil: Date;
}) {
  const event = await prismaClient.event.update({
    where: { id: options.eventId },
    data: {
      participationFrom: options.participationFrom,
      participationUntil: options.participationUntil,
    },
  });

  return event;
}
