import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      participationFrom: true,
      participationUntil: true,
    },
  });
  return event;
}
