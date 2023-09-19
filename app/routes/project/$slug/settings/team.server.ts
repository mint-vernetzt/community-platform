import { prismaClient } from "~/prisma.server";

export async function getProject(slug: string) {
  return await prismaClient.project.findUnique({
    select: {
      id: true,
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
