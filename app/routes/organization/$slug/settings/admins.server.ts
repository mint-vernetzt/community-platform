import { prismaClient } from "~/prisma.server";

export async function getOrganization(slug: string) {
  return await prismaClient.organization.findUnique({
    select: {
      id: true,
      admins: {
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
