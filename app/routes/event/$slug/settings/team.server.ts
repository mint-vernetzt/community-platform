import { prismaClient } from "~/prisma.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type EventTeamSettingsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["event/$slug/settings/team"];

export async function getEvent(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      teamMembers: {
        select: {
          profile: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              position: true,
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
    },
    where: {
      slug,
    },
  });
}
