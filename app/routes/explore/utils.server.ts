import { prismaClient } from "~/prisma.server";

export async function getAllAreas() {
  return await prismaClient.area.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
    },
    orderBy: {
      slug: "asc",
    },
  });
}

export async function getAreaNameBySlug(slug: string) {
  const area = await prismaClient.area.findFirst({
    select: {
      id: true,
      name: true,
    },
    where: {
      slug,
    },
  });
  if (area === null) {
    return undefined;
  }
  return area.name;
}
