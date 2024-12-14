import { prismaClient } from "~/prisma.server";
import { detectLanguage as nextDetectLanguage } from "./i18n.server";
import { type languageModuleMap } from "./locales-next/.server/utils";
import { type ArrayElement } from "./lib/utils/types";
import { type supportedCookieLanguages } from "./i18n";

export async function getProfileByUserId(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      termsAccepted: true,
    },
    where: {
      id,
    },
  });
}

export type RootLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["root"];

export function detectLanguage(request: Request) {
  return nextDetectLanguage(request);
}
