import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
    },
  });

  return event;
}

export async function updateEventBySlug(slug: string, data: { slug: string }) {
  const updateEvent = await prismaClient.event.update({
    where: { slug },
    data,
  });
  return updateEvent;
}
