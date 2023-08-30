import { prismaClient } from "~/prisma.server";

export async function getOrganizationBySlug(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      teamMembers: {
        select: {
          profileId: true,
          isPrivileged: true,
        },
      },
    },
  });

  return organization;
}
