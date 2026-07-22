import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      published: true,
      external: true,
      openForRegistration: true,
      parentParticipationRequired: true,
      _count: {
        select: {
          participants: true,
          waitingList: true,
          participantInvites: {
            where: {
              status: "pending",
            },
          },
          childEvents: true,
        },
      },
      childEvents: {
        select: {
          _count: {
            select: {
              participants: true,
            },
          },
        },
      },
    },
  });

  const participatingGuestsCount = await prismaClient.guest.count({
    where: {
      event: {
        slug,
      },
      onWaitingList: false,
    },
  });
  const guestWaitingListCount = await prismaClient.guest.count({
    where: {
      event: {
        slug,
      },
      onWaitingList: true,
    },
  });

  if (event === null) {
    return null;
  }

  event._count.participants =
    event._count.participants + participatingGuestsCount;
  event._count.waitingList = event._count.waitingList + guestWaitingListCount;

  return event;
}
