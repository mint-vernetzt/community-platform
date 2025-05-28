import { prismaClient } from "~/prisma.server";
import { detectLanguage as nextDetectLanguage } from "./i18n.server";
import { type languageModuleMap } from "./locales/.server";
import { type ArrayElement } from "./lib/utils/types";
import { type SUPPORTED_COOKIE_LANGUAGES } from "./i18n.shared";

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
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["root"];

export function detectLanguage(request: Request) {
  return nextDetectLanguage(request);
}
