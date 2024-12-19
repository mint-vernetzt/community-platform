import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type RemoveAdminFromOrganizationLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["organization/$slug/settings/admins/remove-admin"];

export async function getOrganizationBySlug(slug: string) {
  return await prismaClient.organization.findUnique({
    select: {
      id: true,
      _count: {
        select: {
          admins: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function removeAdminFromOrganization(
  organizationId: string,
  profileId: string
) {
  await prismaClient.adminOfOrganization.delete({
    where: {
      profileId_organizationId: {
        profileId,
        organizationId,
      },
    },
  });
}
