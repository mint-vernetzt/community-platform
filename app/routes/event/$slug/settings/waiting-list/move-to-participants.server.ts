import { prismaClient } from "~/prisma.server";

export async function getProfileByUserId(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
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
      name: true,
      slug: true,
      startTime: true,
      teamMembers: {
        select: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
