import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      name: true,
      subline: true,
      description: true,
      published: true,
      startTime: true,
      endTime: true,
      participationUntil: true,
      participationFrom: true,
      canceled: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      venueCity: true,
      conferenceLink: true,
      conferenceCode: true,
      focuses: {
        select: {
          focusId: true,
        },
      },
      tags: {
        select: {
          tagId: true,
        },
      },
      targetGroups: {
        select: {
          targetGroupId: true,
        },
      },
      types: {
        select: {
          eventTypeId: true,
        },
      },
      areas: {
        select: {
          areaId: true,
        },
      },
      experienceLevel: {
        select: {
          id: true,
        },
      },
      stage: {
        select: {
          id: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function getEventBySlugForAction(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      parentEvent: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
      childEvents: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}
