import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type GeneralEventSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["event/$slug/settings/general"];

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      name: true,
      subline: true,
      description: true,
      published: true,
      startTime: true,
      endTime: true,
      participationUntil: true,
      participationFrom: true,
      canceled: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      venueCity: true,
      conferenceLink: true,
      conferenceCode: true,
      focuses: {
        select: {
          focusId: true,
        },
      },
      tags: {
        select: {
          tagId: true,
        },
      },
      eventTargetGroups: {
        select: {
          eventTargetGroupId: true,
        },
      },
      types: {
        select: {
          eventTypeId: true,
        },
      },
      areas: {
        select: {
          areaId: true,
        },
      },
      experienceLevel: {
        select: {
          id: true,
        },
      },
      stage: {
        select: {
          id: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function getEventBySlugForAction(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      parentEvent: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
      childEvents: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}
