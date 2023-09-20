import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      startTime: true,
      endTime: true,
      published: true,
      childEvents: {
        select: {
          id: true,
          background: true,
          startTime: true,
          endTime: true,
          slug: true,
          name: true,
          participantLimit: true,
          subline: true,
          description: true,
          stage: {
            select: {
              title: true,
            },
          },
          _count: {
            select: {
              childEvents: true,
              participants: true,
              waitingList: true,
            },
          },
        },
      },
      parentEvent: {
        select: {
          id: true,
          background: true,
          startTime: true,
          endTime: true,
          slug: true,
          name: true,
          participantLimit: true,
          subline: true,
          description: true,
          stage: {
            select: {
              title: true,
            },
          },
          _count: {
            select: {
              childEvents: true,
              participants: true,
              waitingList: true,
            },
          },
        },
      },
    },
    where: {
      slug,
    },
  });
}
