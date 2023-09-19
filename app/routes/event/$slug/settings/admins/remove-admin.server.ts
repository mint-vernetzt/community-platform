import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      _count: {
        select: {
          admins: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function removeAdminFromEvent(eventId: string, profileId: string) {
  await prismaClient.adminOfEvent.delete({
    where: {
      profileId_eventId: {
        profileId,
        eventId,
      },
    },
  });
}
