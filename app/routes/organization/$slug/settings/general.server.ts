import { prismaClient } from "~/prisma.server";

export async function getOrganizationBySlug(slug: string) {
  return await prismaClient.organization.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}
