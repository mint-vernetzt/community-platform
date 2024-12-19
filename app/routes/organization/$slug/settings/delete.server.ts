import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type DeleteOrganizationLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["organization/$slug/settings/delete"];

export async function deleteOrganizationBySlug(slug: string) {
  await prismaClient.organization.delete({ where: { slug: slug } });
}

export async function getProfileByUserId(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      username: true,
    },
    where: {
      id,
    },
  });
}
