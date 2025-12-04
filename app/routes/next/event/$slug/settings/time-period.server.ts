import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
  });
  return event;
}

export async function updateEventBySlug(
  slug: string,
  data: {
    startTime: Date;
    endTime: Date;
  }
) {
  const updatedEvent = await prismaClient.event.update({
    where: { slug },
    data,
  });
  return updatedEvent;
}
