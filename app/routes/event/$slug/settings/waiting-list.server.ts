import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      participants: {
        select: {
          createdAt: true,
          profile: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
      waitingList: {
        select: {
          createdAt: true,
          profile: {
            select: {
              id: true,
              username: true,
              position: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          childEvents: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export function getParticipantsDataFromEvent(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>
) {
  const participantsData = event.participants.map((item) => {
    return { ...item.profile, createdAt: item.createdAt };
  });
  const waitingListData = event.waitingList.map((item) => {
    return { ...item.profile, createdAt: item.createdAt };
  });
  return { participants: participantsData, waitingList: waitingListData };
}
