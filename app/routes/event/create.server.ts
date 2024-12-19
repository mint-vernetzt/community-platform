import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type CreateEventLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["event/create"];

export async function getEventById(id: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
    where: {
      id,
    },
  });
}
