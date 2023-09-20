import { prismaClient } from "~/prisma.server";

export async function deleteOrganizationBySlug(slug: string) {
  await prismaClient.organization.delete({ where: { slug: slug } });
}

export async function getProfileByUserId(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      username: true,
    },
    where: {
      id,
    },
  });
}
