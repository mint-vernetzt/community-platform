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

export function getPaginationValues(
  request: Request,
  options?: { itemsPerPage?: number; param?: string }
) {
  const { itemsPerPage = 12, param = "page" } = options || {};

  const url = new URL(request.url);
  const pageParam = url.searchParams.get(param) || "1";

  let page = parseInt(pageParam);
  if (Number.isNaN(page) || page < 1) {
    page = 1;
  }

  const skip = itemsPerPage * (page - 1);
  const take = itemsPerPage;

  return { skip, take, page, itemsPerPage };
}
