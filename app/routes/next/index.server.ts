import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import testimonials from "./testimonials.json";
import sharepicImage from "~/assets/landing-page/sharepic 1.png";
import sharepicBlurredImage from "~/assets/landing-page/sharepic 1-blurred.webp";
import mapImage from "~/assets/landing-page/community-map.png";
import mapBlurredImage from "~/assets/landing-page/community-map-blurred.webp";
import mediaDatabaseImage from "~/assets/landing-page/media-database.png";
import mediaDatabaseBlurredImage from "~/assets/landing-page/media-database-blurred.webp";

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

export function getDataForToolsSection() {
  type ToolKey = keyof (typeof languageModuleMap)[
    "de" | "en"]["next/index"]["route"]["tools"]["items"];
  type ToolListItems = Array<{
    name: ToolKey;
    link: string;
    imagePath: string;
    blurredImagePath: string;
    external: boolean;
    bgClassName?: string;
  }>;
  const toolListItems: ToolListItems = [
    {
      name: "sharepic",
      link: "https://sharepic.mint-vernetzt.de/",
      imagePath: sharepicImage,
      blurredImagePath: sharepicBlurredImage,
      external: true,
    },
    {
      name: "map",
      link: "/explore/organizations/map",
      imagePath: mapImage,
      blurredImagePath: mapBlurredImage,
      external: false,
    },
    {
      name: "mediaDatabase",
      link: "https://mediendatenbank.mint-vernetzt.de",
      imagePath: mediaDatabaseImage,
      blurredImagePath: mediaDatabaseBlurredImage,
      external: true,
      bgClassName: "bg-[#222831] py-4 px-9",
    },
    {
      name: "fundings",
      link: "/explore/fundings",
      imagePath: "",
      blurredImagePath: "",
      external: false,
      bgClassName: "bg-neutral-50",
    },
  ];
  return toolListItems;
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
