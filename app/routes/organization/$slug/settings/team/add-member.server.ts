import { prismaClient } from "~/prisma.server";

export async function getProfileById(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      memberOf: {
        select: {
          organization: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
    where: {
      id,
    },
  });
}

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

export async function addTeamMemberToOrganization(
  organizationId: string,
  profileId: string
) {
  await prismaClient.memberOfOrganization.create({
    data: {
      profileId,
      organizationId,
    },
  });
}
