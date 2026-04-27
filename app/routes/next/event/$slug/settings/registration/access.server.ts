import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      published: true,
      external: true,
      openForRegistration: true,
      externalRegistrationUrl: true,
    },
  });
  return event;
}

export async function updateEventRegistrationAccess(options: {
  eventId: string;
  external?: boolean;
  openForRegistration?: boolean;
}) {
  const updatedEvent = await prismaClient.event.update({
    where: { id: options.eventId },
    data: {
      external: options.external,
      openForRegistration: options.openForRegistration,
    },
  });

  return updatedEvent;
}

export async function updateEventExternalRegistrationUrl(options: {
  eventId: string;
  externalRegistrationUrl: string | null;
}) {
  const updatedEvent = await prismaClient.event.update({
    where: { id: options.eventId },
    data: {
      externalRegistrationUrl: options.externalRegistrationUrl,
    },
  });

  return updatedEvent;
}
