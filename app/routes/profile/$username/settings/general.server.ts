import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type GeneralProfileSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["profile/$username/settings/general"];

export async function getProfileByUsername(username: string) {
  const profile = await prismaClient.profile.findUnique({
    where: { username },
    select: {
      id: true,
    },
  });

  return profile;
}
