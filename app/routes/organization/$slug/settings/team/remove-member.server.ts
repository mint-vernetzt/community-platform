import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type RemoveOrganizationTeamMemberLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["organization/$slug/settings/team/remove-member"];

export async function getOrganizationBySlug(slug: string) {
  return await prismaClient.organization.findUnique({
    select: {
      id: true,
      _count: {
        select: {
          teamMembers: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function removeTeamMemberFromOrganization(
  organizationId: string,
  profileId: string
) {
  await prismaClient.memberOfOrganization.delete({
    where: {
      profileId_organizationId: {
        profileId,
        organizationId,
      },
    },
  });
}
