import { type EventReminderType } from "@prisma/client";
import { prismaClient } from "~/prisma.server";

export async function getEvent(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      activeReminderMails: true,
      external: true,
      stage: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  if (event === null) {
    return null;
  }

  return event;
}

export async function getCurrentActiveReminderMails(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      activeReminderMails: true,
    },
  });

  if (event === null) {
    return [];
  }

  return event.activeReminderMails;
}

export async function updateEventActiveReminderMails(
  slug: string,
  activeReminderMails: EventReminderType[]
) {
  const event = await prismaClient.event.update({
    where: { slug },
    data: { activeReminderMails },
  });

  return event;
}
