import type { Document } from "@prisma/client";
import { prismaClient } from "./prisma";

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
