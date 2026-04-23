import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      published: true,
      external: true,
      openForRegistration: true,
    },
  });

  return event;
}

export async function updateEventRegistrationAccessBySlug(
  slug: string,
  options: { external?: boolean; openForRegistration?: boolean }
) {
  const updatedEvent = await prismaClient.event.update({
    where: { slug },
    data: {
      external: options.external,
      openForRegistration: options.openForRegistration,
    },
  });

  return updatedEvent;
}
