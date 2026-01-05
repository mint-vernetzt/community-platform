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

export async function cancelEventBySlug(slug: string) {
  const canceledEvent = await prismaClient.event.update({
    where: { slug },
    data: { canceled: true },
  });
  return canceledEvent;
}
