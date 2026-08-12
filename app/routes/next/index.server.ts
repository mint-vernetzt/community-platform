import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";

export type NextLandingPageLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["next/index"];

export const PROJECT_TEASER_ORGANIZATION_NAME = "Tinkertank";

export async function getProjectTeaserOrganizationSlug() {
  const organization = await prismaClient.organization.findFirst({
    select: {
      slug: true,
    },
    where: {
      name: {
        equals: PROJECT_TEASER_ORGANIZATION_NAME,
        mode: "insensitive",
      },
    },
  });

  if (organization === null) {
    return null;
  }

  return organization.slug;
}
