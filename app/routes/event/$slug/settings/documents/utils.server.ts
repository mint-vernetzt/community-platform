import type { Document } from "@prisma/client";
import { prismaClient } from "~/prisma.server";

export async function createDocumentOnEvent(
  eventId: string,
  document: Pick<
    Document,
    "filename" | "path" | "sizeInMB" | "mimeType" | "extension"
  >
) {
  const profile = prismaClient.event.update({
    where: {
      id: eventId,
    },
    data: {
      documents: {
        create: {
          document: {
            create: {
              ...document,
            },
          },
        },
      },
      updatedAt: new Date(),
    },
  });
  return profile;
}

export async function disconnectDocumentFromEvent(id: string) {
  await prismaClient.document.delete({
    where: {
      id,
    },
  });
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}
