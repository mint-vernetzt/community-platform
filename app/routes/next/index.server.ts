import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";

export type NextLandingPageLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["next/index"];

export const PROJECT_TEASER_ORGANIZATION_NAME = "Tinkertank";
export const EVENT_TEASER_ORGANIZATION_NAME = "MINTvernetzt";
export const UPCOMING_EVENTS_COUNT = 3;

export async function getUpcomingEvents() {
  const events = await prismaClient.event.findMany({
    select: {
      slug: true,
      name: true,
      startTime: true,
      endTime: true,
    },
    where: {
      published: true,
      endTime: {
        gte: new Date(),
      },
    },
    orderBy: {
      startTime: "asc",
    },
    take: UPCOMING_EVENTS_COUNT,
  });

  return events;
}

export async function getProjectTeaserOrganizationSlug() {
  const organization = await prismaClient.organization.findFirst({
    select: {
      slug: true,
    },
    where: {
      name: {
        equals: PROJECT_TEASER_ORGANIZATION_NAME,
        mode: "insensitive",
      },
    },
  });

  if (organization === null) {
    return null;
  }

  return organization.slug;
}

export async function getEventTeaserOrganizationSlug() {
  const organization = await prismaClient.organization.findFirst({
    select: {
      slug: true,
    },
    where: {
      name: {
        equals: EVENT_TEASER_ORGANIZATION_NAME,
        mode: "insensitive",
      },
    },
  });

  if (organization === null) {
    return null;
  }

  return organization.slug;
}
