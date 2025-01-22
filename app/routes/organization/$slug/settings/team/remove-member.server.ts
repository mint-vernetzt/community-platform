import { prismaClient } from "~/prisma.server";

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
