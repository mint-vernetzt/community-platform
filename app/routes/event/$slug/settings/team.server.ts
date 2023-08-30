import { prismaClient } from "~/prisma.server";

export async function getEvent(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      teamMembers: {
        select: {
          profile: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              position: true,
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
