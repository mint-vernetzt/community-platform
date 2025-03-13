import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";

export type DeleteProjectLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["project/$slug/settings/danger-zone/delete"];

export async function deleteProjectBySlug(slug: string) {
  await prismaClient.project.delete({ where: { slug: slug } });
}
