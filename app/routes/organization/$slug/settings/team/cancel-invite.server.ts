import { prismaClient } from "~/prisma.server";

export async function getOrganizationBySlug(slug: string) {
  return await prismaClient.organization.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}

export async function cancelInviteOfProfileFromOrganization(
  organizationId: string,
  profileId: string
) {
  await prismaClient.inviteForProfileToJoinOrganization.update({
    where: {
      profileId_organizationId_role: {
        profileId,
        organizationId,
        role: "member",
      },
    },
    data: {
      status: "canceled",
    },
  });
}
