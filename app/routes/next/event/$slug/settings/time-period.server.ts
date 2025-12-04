import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      parentEvent: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  if (event === null) {
    return null;
  }

  const childEventAggregate = await prismaClient.event.aggregate({
    where: { parentEventId: event.id },
    _min: { startTime: true },
    _max: { endTime: true },
  });

  return {
    ...event,
    childEvents:
      childEventAggregate._min.startTime !== null &&
      childEventAggregate._max.endTime !== null
        ? {
            earliestStartTime: childEventAggregate._min.startTime,
            latestEndTime: childEventAggregate._max.endTime,
          }
        : null,
  };
}

export async function getEventBySlugForValidation(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      parentEvent: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  if (event === null) {
    return null;
  }

  const childEventAggregate = await prismaClient.event.aggregate({
    where: { parentEventId: event.id },
    _min: { startTime: true },
    _max: { endTime: true },
  });

  return {
    ...event,
    childEvents:
      childEventAggregate._min.startTime !== null &&
      childEventAggregate._max.endTime !== null
        ? {
            earliestStartTime: childEventAggregate._min.startTime,
            latestEndTime: childEventAggregate._max.endTime,
          }
        : null,
  };
}

export async function updateEventBySlug(
  slug: string,
  data: {
    startTime: Date;
    endTime: Date;
  }
) {
  const updatedEvent = await prismaClient.event.update({
    where: { slug },
    data,
  });
  return updatedEvent;
}
