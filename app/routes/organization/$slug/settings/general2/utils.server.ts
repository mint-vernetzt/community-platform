import { prismaClient } from "~/prisma";

export async function getOrganizationBySlug(slug: string) {
  const organization = await prismaClient.organization.findFirst({
    where: { slug },
    include: {
      types: { select: { organizationTypeId: true } },
      areas: { select: { areaId: true } },
    },
  });
  return organization;
}

export async function getOrganizationTypes() {
  const result = await prismaClient.organizationType.findMany();
  return result;
}

export async function getAreas() {
  return await prismaClient.area.findMany({
    include: {
      state: true,
    },
  });
}
