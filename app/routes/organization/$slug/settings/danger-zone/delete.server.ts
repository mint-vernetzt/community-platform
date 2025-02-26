import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";

export type DeleteOrganizationLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["organization/$slug/settings/danger-zone/delete"];

export async function deleteOrganizationBySlug(slug: string) {
  await prismaClient.organization.delete({ where: { slug: slug } });
}
