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
