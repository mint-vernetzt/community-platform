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
          startTime: true,
          endTime: true,
          name: true,
          slug: true,
          participantLimit: true,
          _count: {
            select: { participants: true },
          },
          stage: {
            select: { slug: true },
          },
        },
      },
      childEvents: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          name: true,
          slug: true,
          participantLimit: true,
          _count: {
            select: { participants: true },
          },
          stage: {
            select: { slug: true },
          },
        },
        orderBy: { startTime: "asc" },
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
            metrics: {
              earliestStartTime: childEventAggregate._min.startTime,
              latestEndTime: childEventAggregate._max.endTime,
            },
            data: event.childEvents,
          }
        : {
            metrics: null,
            data: event.childEvents,
          },
  };
}

export async function getEventBySlugForValidation(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      parentEvent: {
        select: {
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
