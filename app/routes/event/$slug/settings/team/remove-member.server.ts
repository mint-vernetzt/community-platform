import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      _count: {
        select: {
          teamMembers: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function removeTeamMemberFromEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.teamMemberOfEvent.delete({
    where: {
      eventId_profileId: {
        eventId,
        profileId,
      },
    },
  });
}
