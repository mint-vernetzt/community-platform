import { prismaClient } from "~/prisma.server";

export async function getDocumentById(id: string) {
  return await prismaClient.document.findFirst({
    where: {
      id,
    },
    select: {
      title: true,
      filename: true,
      path: true,
    },
  });
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      slug: true,
      documents: {
        select: {
          document: {
            select: {
              path: true,
              filename: true,
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
