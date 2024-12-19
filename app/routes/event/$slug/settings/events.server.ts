import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type ConnectedEventsSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["event/$slug/settings/events"];

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      startTime: true,
      endTime: true,
      published: true,
      childEvents: {
        select: {
          id: true,
          background: true,
          startTime: true,
          endTime: true,
          slug: true,
          name: true,
          participantLimit: true,
          subline: true,
          description: true,
          stage: {
            select: {
              slug: true,
            },
          },
          _count: {
            select: {
              childEvents: true,
              participants: true,
              waitingList: true,
            },
          },
        },
      },
      parentEvent: {
        select: {
          id: true,
          background: true,
          startTime: true,
          endTime: true,
          slug: true,
          name: true,
          participantLimit: true,
          subline: true,
          description: true,
          stage: {
            select: {
              slug: true,
            },
          },
          _count: {
            select: {
              childEvents: true,
              participants: true,
              waitingList: true,
            },
          },
        },
      },
    },
    where: {
      slug,
    },
  });
}
