import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import testimonials from "./testimonials.json";

export type NextLandingPageLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["next/index"];

export const UPCOMING_EVENTS_COUNT = 3;

export async function getEventTeaserOrganization() {
  const organization = await prismaClient.organization.findFirst({
    select: {
      slug: true,
    },
    where: {
      slug: "mintvernetzt",
    },
  });

  return organization;
}

export async function getUpcomingEvents() {
  const events = await prismaClient.event.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      startTime: true,
      endTime: true,
      participantLimit: true,
      openForRegistration: true,
      external: true,
      subline: true,
      description: true,
      stage: {
        select: {
          slug: true,
        },
      },
      _count: {
        select: {
          participants: true,
          guests: {
            where: {
              onWaitingList: false,
              confirmed: true,
            },
          },
        },
      },
    },
    where: {
      published: true,
      canceled: false,
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

export async function getProjectTeaserOrganization() {
  const organization = await prismaClient.organization.findFirst({
    select: {
      slug: true,
    },
    where: {
      slug: "tinkertankinteractivemediafoundationggmbh-lgoznhy0",
    },
  });

  return organization;
}

export async function getTestimonials() {
  const usernames = testimonials.map((testimonial) => {
    return testimonial.username;
  });

  const profiles = await prismaClient.profile.findMany({
    select: {
      username: true,
    },
    where: {
      username: {
        in: usernames,
      },
    },
  });

  const existingUsernames = profiles.map((profile) => {
    return profile.username;
  });

  // Does the profile still exist? Link to the profile : don't link to the profile
  const result = testimonials.map((testimonial) => {
    return {
      ...testimonial,
      profileExists: existingUsernames.includes(testimonial.username),
    };
  });

  return result;
}
