import { prismaClient } from "~/prisma";

export async function getProfileByEmail(email: string) {
  const profile = await prismaClient.profile.findFirst({
    where: { email },
    include: {
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
  });
  return profile;
}

export async function getOrganizationBySlug(slug: string) {
  const organization = await prismaClient.organization.findFirst({
    select: { id: true },
    where: { slug },
  });
  return organization;
}

export async function connectProfileToOrganization(
  profileId: string,
  organizationId: string
) {
  const result = await prismaClient.memberOfOrganization.create({
    data: {
      profileId,
      organizationId,
    },
  });
  return result;
}

export async function disconnectProfileFromOrganization(
  profileId: string,
  organizationId: string
) {
  const result = await prismaClient.memberOfOrganization.delete({
    where: {
      profileId_organizationId: {
        profileId,
        organizationId,
      },
    },
  });
  return result;
}

export async function allowedToModify(
  profileId: string,
  organizationId: string
) {
  const result = await prismaClient.memberOfOrganization.findFirst({
    where: {
      profileId,
      organizationId,
      isPrivileged: true,
    },
  });
  return result !== null;
}

export async function getMembers(organizationId: string) {
  const result = await prismaClient.memberOfOrganization.findMany({
    where: {
      organizationId,
    },
  });
  return result;
}
