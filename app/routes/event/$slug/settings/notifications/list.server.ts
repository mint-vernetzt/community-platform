import { prismaClient } from "~/prisma.server";

export async function getEvent(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      activeReminderMails: true,
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
