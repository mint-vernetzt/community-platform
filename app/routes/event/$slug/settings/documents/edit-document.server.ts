import type { Document } from "@prisma/client";
import { prismaClient } from "~/prisma.server";

export async function updateDocument(
  id: string,
  data: Pick<Document, "title" | "description">
) {
  await prismaClient.document.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}
