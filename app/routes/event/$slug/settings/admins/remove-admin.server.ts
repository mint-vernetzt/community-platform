import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";

export type RemoveEventAdminLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["event/$slug/settings/admins/remove-admin"];

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
      _count: {
        select: {
          admins: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function removeAdminFromEvent(eventId: string, profileId: string) {
  await prismaClient.adminOfEvent.delete({
    where: {
      profileId_eventId: {
        profileId,
        eventId,
      },
    },
  });
}
