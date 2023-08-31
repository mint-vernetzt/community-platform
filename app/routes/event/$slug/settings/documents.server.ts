import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      slug: true,
      published: true,
      documents: {
        select: {
          document: {
            select: {
              id: true,
              title: true,
              filename: true,
              sizeInMB: true,
              extension: true,
              description: true,
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
