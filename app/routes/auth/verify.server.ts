import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";

export type VerifyLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["auth/verify"];

export async function getNumberOfGuestsByEmail(email: string) {
  const guests = await prismaClient.guest.count({
    where: {
      email,
    },
  });
  return guests;
}
