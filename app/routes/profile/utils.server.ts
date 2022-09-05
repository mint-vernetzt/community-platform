import { prismaClient } from "~/prisma";

export async function getEventById(id: string) {
  const result = await prismaClient.event.findFirst({
    where: { id },
    select: {
      name: true,
      slug: true,
      published: true,
      parentEventId: true,
    },
  });
  return result;
}
