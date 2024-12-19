import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type DeleteEventLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["event/$slug/settings/delete"];

export async function getProfileById(id: string) {
  const profile = await prismaClient.profile.findFirst({
    where: {
      id,
    },
    select: {
      username: true,
    },
  });
  return profile;
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      name: true,
      childEvents: {
        select: {
          id: true,
          name: true,
          slug: true,
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
      name: true,
    },
    where: {
      slug,
    },
  });
}
