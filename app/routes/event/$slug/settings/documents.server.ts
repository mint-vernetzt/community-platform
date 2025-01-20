import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";

export type EventDocumentsSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["event/$slug/settings/documents"];

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      slug: true,
      published: true,
      documents: {
        select: {
          document: {
            select: {
              id: true,
              title: true,
              filename: true,
              sizeInMB: true,
              extension: true,
              description: true,
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
