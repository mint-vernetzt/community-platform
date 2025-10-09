import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      name: true,
      background: true,
      startTime: true,
      endTime: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      venueCity: true,
      participantLimit: true,
      participationFrom: true,
      participationUntil: true,
      published: true,
      canceled: true,
      stage: {
        select: {
          slug: true,
        },
      },
      parentEvent: {
        select: {
          name: true,
          slug: true,
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  return event;
}
