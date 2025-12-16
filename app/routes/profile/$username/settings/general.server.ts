import { prismaClient } from "~/prisma.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { type getWholeProfileFromUsername } from "../utils.server";

export type GeneralProfileSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof SUPPORTED_COOKIE_LANGUAGES
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

export function makeFormProfileFromDbProfile(
  dbProfile: NonNullable<
    Awaited<ReturnType<typeof getWholeProfileFromUsername>>
  >
) {
  return {
    ...dbProfile,
    areas: dbProfile.areas.map((area) => area.area.id),
    offers: dbProfile.offers.map((offer) => offer.offer.id),
    seekings: dbProfile.seekings.map((seeking) => seeking.offer.id),
  };
}
