import { prismaClient } from "~/prisma.server";

export async function createOrganizationOnProfile(
  profileId: string,
  organizationName: string,
  organizationSlug: string
) {
  const [profile] = await prismaClient.$transaction([
    prismaClient.profile.update({
      where: {
        id: profileId,
      },
      data: {
        memberOf: {
          create: {
            isPrivileged: true,
            organization: {
              create: {
                name: organizationName,
                slug: organizationSlug,
                organizationVisibility: {
                  create: {},
                },
              },
            },
          },
        },
      },
    }),
    prismaClient.organization.update({
      where: {
        slug: organizationSlug,
      },
      data: {
        admins: {
          create: {
            profileId: profileId,
          },
        },
      },
    }),
  ]);
  return profile;
}
