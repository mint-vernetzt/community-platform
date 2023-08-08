import { prismaClient } from "~/prisma";

export async function getEventWithParticipantCount(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      _count: {
        select: {
          participants: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function updateParticipantLimit(
  slug: string,
  participantLimit: number | null
) {
  await prismaClient.event.update({
    where: {
      slug,
    },
    data: {
      participantLimit,
    },
  });
}
