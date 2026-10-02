import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import sharepicImage from "~/assets/landing-page/sharepic 1.webp";
import sharepicBlurredImage from "~/assets/landing-page/sharepic 1-blurred.webp";
import mapImage from "~/assets/landing-page/community-map.webp";
import mapBlurredImage from "~/assets/landing-page/community-map-blurred.webp";
import mediaDatabaseImage from "~/assets/landing-page/media-database.webp";
import mediaDatabaseBlurredImage from "~/assets/landing-page/media-database-blurred.webp";
import mvAnnualMeetingImage from "~/assets/landing-page/Jahrestagung_2025_Head_NMF_page 1.webp";
import mvAnnualMeetingBlurredImage from "~/assets/landing-page/Jahrestagung_2025_Head_NMF_page 1-blurred.webp";
import thinkathon24Image from "~/assets/landing-page/231121_thinkathon_HF_1425 1.webp";
import thinkathon24BlurredImage from "~/assets/landing-page/231121_thinkathon_HF_1425 1-blurred.webp";
import thinkathon22Image from "~/assets/landing-page/MINTvernetzt_Tag_01_Foto_Andi_Weiland-112 (1) 1.webp";
import thinkathon22BlurredImage from "~/assets/landing-page/MINTvernetzt_Tag_01_Foto_Andi_Weiland-112 (1) 1-blurred.webp";
import thinkathon22_2Image from "~/assets/landing-page/MINTvernetzt_Tag_01_Foto_Andi_weiland-121 1.webp";
import thinkathon22_2BlurredImage from "~/assets/landing-page/MINTvernetzt_Tag_01_Foto_Andi_weiland-121 1-blurred.webp";
import designBasedLearningImage from "~/assets/landing-page/DesignBasedLearning_BBarth_5 2.webp";
import designBasedLearningBlurredImage from "~/assets/landing-page/DesignBasedLearning_BBarth_5 2-blurred.webp";
import thinkathon24_2Image from "~/assets/landing-page/231121_thinkathon_HF_1689 1.webp";
import thinkathon24_2BlurredImage from "~/assets/landing-page/231121_thinkathon_HF_1689 1-blurred.webp";
import thinkathon22_3Image from "~/assets/landing-page/Lisa Ihde 1.webp";
import thinkathon22_3BlurredImage from "~/assets/landing-page/Lisa Ihde 1-blurred.webp";
import thinkathon22_4Image from "~/assets/landing-page/Yosa Peit 1.webp";
import thinkathon22_4BlurredImage from "~/assets/landing-page/Yosa Peit 1-blurred.webp";
import designBasedLearning_2Image from "~/assets/landing-page/DesignBasedLearning_BBarth_Avatar_14 1.webp";
import designBasedLearning_2BlurredImage from "~/assets/landing-page/DesignBasedLearning_BBarth_Avatar_14 1-blurred.webp";
import { type ImageGravity } from "@mint-vernetzt/components/src/molecules/Image";
import katrinSImage from "~/assets/landing-page/testimonials/katrinS.webp";
import katrinSBlurredImage from "~/assets/landing-page/testimonials/katrinS-blurred.webp";
import franziskaSImage from "~/assets/landing-page/testimonials/franziskaS.webp";
import franziskaSBlurredImage from "~/assets/landing-page/testimonials/franziskaS-blurred.webp";
import piaCImage from "~/assets/landing-page/testimonials/piaC.webp";
import piaCBlurredImage from "~/assets/landing-page/testimonials/piaC-blurred.webp";
import irisLImage from "~/assets/landing-page/testimonials/irisL.webp";
import irisLBlurredImage from "~/assets/landing-page/testimonials/irisL-blurred.webp";
import neleSImage from "~/assets/landing-page/testimonials/neleS.webp";
import neleSBlurredImage from "~/assets/landing-page/testimonials/neleS-blurred.webp";

export type NextLandingPageLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["index"];

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
    "de" | "en"]["index"]["route"]["tools"]["items"];
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

export function getDataForCommunityImages() {
  type CommunityImageKey = keyof (typeof languageModuleMap)[
    "de" | "en"]["index"]["route"]["community"]["items"];
  type ToolListItems = Array<{
    name: CommunityImageKey;
    src: string;
    blurredSrc: string;
    gravity: ImageGravity;
  }>;
  const communityImages: ToolListItems = [
    {
      name: "mvAnnualMeeting",
      src: mvAnnualMeetingImage,
      blurredSrc: mvAnnualMeetingBlurredImage,
      gravity: "center",
    },
    {
      name: "thinkathon24",
      src: thinkathon24Image,
      blurredSrc: thinkathon24BlurredImage,
      gravity: "left",
    },
    {
      name: "thinkathon22",
      src: thinkathon22Image,
      blurredSrc: thinkathon22BlurredImage,
      gravity: "top-left",
    },
    {
      name: "thinkathon22_2",
      src: thinkathon22_2Image,
      blurredSrc: thinkathon22_2BlurredImage,
      gravity: "center",
    },
    {
      name: "designBasedLearning",
      src: designBasedLearningImage,
      blurredSrc: designBasedLearningBlurredImage,
      gravity: "top",
    },
    {
      name: "thinkathon24_2",
      src: thinkathon24_2Image,
      blurredSrc: thinkathon24_2BlurredImage,
      gravity: "top",
    },
    {
      name: "thinkathon22_3",
      src: thinkathon22_3Image,
      blurredSrc: thinkathon22_3BlurredImage,
      gravity: "top",
    },
    {
      name: "thinkathon22_4",
      src: thinkathon22_4Image,
      blurredSrc: thinkathon22_4BlurredImage,
      gravity: "top",
    },
    {
      name: "designBasedLearning_2",
      src: designBasedLearning_2Image,
      blurredSrc: designBasedLearning_2BlurredImage,
      gravity: "left",
    },
  ];

  return communityImages;
}

export async function getDataForTestimonialsSection() {
  type TestimonialKey = keyof (typeof languageModuleMap)[
    "de" | "en"]["index"]["route"]["testimonials"]["items"];
  type TestimonialListItems = Array<{
    id: TestimonialKey;
    name: string;
    username: string | null;
    imagePath: string;
    blurredImagePath: string;
  }>;
  const toolListItems: TestimonialListItems = [
    {
      id: "katrinS",
      name: "Katrin Schneider-Özbek",
      username:
        (await prismaClient.profile.findUnique({
          where: { username: "katrinschneideroezbek-lxise6zg" },
          select: { username: true },
        })) === null
          ? null
          : "katrinschneideroezbek-lxise6zg",
      imagePath: katrinSImage,
      blurredImagePath: katrinSBlurredImage,
    },
    {
      id: "franziskaS",
      name: "Franziska Schwab",
      username:
        (await prismaClient.profile.findUnique({
          where: { username: "franziskaschwab" },
          select: { username: true },
        })) === null
          ? null
          : "franziskaschwab",
      imagePath: franziskaSImage,
      blurredImagePath: franziskaSBlurredImage,
    },
    {
      id: "piaC",
      name: "Pia Čukić",
      username:
        (await prismaClient.profile.findUnique({
          where: { username: "piacukic-m4n3x0v1" },
          select: { username: true },
        })) === null
          ? null
          : "piacukic-m4n3x0v1",
      imagePath: piaCImage,
      blurredImagePath: piaCBlurredImage,
    },
    {
      id: "neleS",
      name: "Nele Steigerwald",
      username:
        (await prismaClient.profile.findUnique({
          where: { username: "nele        steigerwald" },
          select: { username: true },
        })) === null
          ? null
          : "nele        steigerwald",
      imagePath: neleSImage,
      blurredImagePath: neleSBlurredImage,
    },
    {
      id: "irisL",
      name: "Iris Lange-Schmalz",
      username:
        (await prismaClient.profile.findUnique({
          where: { username: "irislangeschmalz-lda1u6fd" },
          select: { username: true },
        })) === null
          ? null
          : "irislangeschmalz-lda1u6fd",
      imagePath: irisLImage,
      blurredImagePath: irisLBlurredImage,
    },
  ];
  return toolListItems;
}

export async function getAboutSectionOrganization() {
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
