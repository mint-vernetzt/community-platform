import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      slug: true,
      name: true,
      startTime: true,
      endTime: true,
      createdAt: true,
      updatedAt: true,
      description: true,
      tags: {
        select: {
          tag: {
            select: {
              title: true,
            },
          },
        },
      },
      venueCity: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      conferenceLink: true,
      conferenceCode: true,
    },
    where: {
      slug,
    },
  });
}
