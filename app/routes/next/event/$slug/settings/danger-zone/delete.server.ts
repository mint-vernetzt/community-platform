import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      name: true,
      published: true,
      canceled: true,
    },
  });
  return event;
}

export async function deleteEventBySlug(slug: string) {
  const deletedEvent = await prismaClient.event.delete({
    where: { slug },
  });
  return deletedEvent;
}
