import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type EventParticipantsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["event/$slug/settings/participants"];

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

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      participantLimit: true,
      participants: {
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
