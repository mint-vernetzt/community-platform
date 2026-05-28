import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      name: true,
      published: true,
      canceled: true,
      childEvents: {
        select: {
          slug: true,
          name: true,
          startTime: true,
          endTime: true,
          participantLimit: true,
          stage: {
            select: {
              slug: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      },
      _count: {
        select: {
          childEvents: true,
        },
      },
    },
  });
  return event;
}

export async function cancelEventBySlug(options: {
  slug: string;
  cancelChildEvents?: boolean;
}) {
  const { slug, cancelChildEvents } = options;
  const canceledEvent = await prismaClient.event.update({
    where: { slug },
    data: { canceled: true },
  });
  if (cancelChildEvents) {
    await prismaClient.event.updateMany({
      where: { parentEvent: { slug } },
      data: { canceled: true },
    });
  } else {
    await prismaClient.event.updateMany({
      where: { parentEvent: { slug }, canceled: false },
      data: { parentEventId: null },
    });
  }
  return canceledEvent;
}
