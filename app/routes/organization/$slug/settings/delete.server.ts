import { prismaClient } from "~/prisma.server";

export async function deleteOrganizationBySlug(slug: string) {
  await prismaClient.organization.delete({ where: { slug: slug } });
}
