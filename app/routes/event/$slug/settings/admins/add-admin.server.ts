import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";

export type AddEventAdminLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["event/$slug/settings/admins/add-admin"];

export async function getProfileById(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      administeredEvents: {
        select: {
          event: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
    where: {
      id,
    },
  });
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}

export async function addAdminToEvent(eventId: string, profileId: string) {
  await prismaClient.adminOfEvent.create({
    data: {
      profileId,
      eventId,
    },
  });
}
