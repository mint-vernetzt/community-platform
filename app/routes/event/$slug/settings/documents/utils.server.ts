import { prismaClient } from "~/prisma";

export async function disconnectDocumentFromEvent(id: string) {
  await prismaClient.document.delete({
    where: {
      id,
    },
  });
}
