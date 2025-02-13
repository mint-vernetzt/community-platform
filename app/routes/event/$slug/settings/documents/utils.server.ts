import type { Document } from "@prisma/client";
import { prismaClient } from "~/prisma.server";

export async function createDocumentOnEvent(
  slug: string,
  document: Pick<
    Document,
    "filename" | "path" | "sizeInMB" | "mimeType" | "extension"
  >
) {
  const event = prismaClient.event.update({
    where: {
      slug,
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
  return event;
}

export async function disconnectDocumentFromEvent(id: string) {
  await prismaClient.document.delete({
    where: {
      id,
    },
  });
}
