import { prismaClient } from "~/prisma.server";

export async function getEventById(id: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
    where: {
      id,
    },
  });
}
