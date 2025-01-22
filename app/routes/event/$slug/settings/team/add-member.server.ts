import { prismaClient } from "~/prisma.server";

export async function getProfileById(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      teamMemberOfEvents: {
        select: {
          event: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
    where: {
      id,
    },
  });
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}

export async function addTeamMemberToEvent(eventId: string, profileId: string) {
  await prismaClient.teamMemberOfEvent.create({
    data: {
      profileId,
      eventId,
    },
  });
}
