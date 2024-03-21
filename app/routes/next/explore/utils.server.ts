import { type Area, type Prisma } from "@prisma/client";
import { prismaClient } from "~/prisma.server";

export async function getAreasBySearchQuery(queryString?: string) {
  const whereQueries: {
    [K in Area as string]: { contains: string; mode: Prisma.QueryMode };
  }[] = [];
  if (queryString !== undefined && queryString.length >= 3) {
    const query = queryString.split(" ");
    for (const word of query) {
      whereQueries.push({ name: { contains: word, mode: "insensitive" } });
    }
  }

  return await prismaClient.area.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
    },
    where: {
      OR: [
        ...whereQueries,
        {
          type: {
            in: ["global", "country"],
          },
        },
      ],
    },
    take: 12,
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
