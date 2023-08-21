import { prismaClient } from "~/prisma.server";

export async function updateOrganizationTeamMemberPrivilege(
  organizationId: string,
  teamMemberId: string,
  isPrivileged: boolean
) {
  await prismaClient.memberOfOrganization.update({
    where: {
      profileId_organizationId: {
        profileId: teamMemberId,
        organizationId,
      },
    },
    data: {
      isPrivileged,
    },
  });
}
