import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      types: {
        select: {
          eventType: {
            select: {
              slug: true,
            },
          },
        },
      },
      subline: true,
      description: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      venueCity: true,
      eventTargetGroups: {
        select: {
          eventTargetGroup: {
            select: {
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
      experienceLevel: {
        select: {
          slug: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              slug: true,
            },
          },
        },
      },
      eventVisibility: {
        select: {
          id: true,
          types: true,
          subline: true,
          description: true,
          venueName: true,
          venueStreet: true,
          venueStreetNumber: true,
          venueZipCode: true,
          venueCity: true,
          eventTargetGroups: true,
          focuses: true,
          experienceLevel: true,
          tags: true,
        },
      },
    },
  });

  return event;
}
