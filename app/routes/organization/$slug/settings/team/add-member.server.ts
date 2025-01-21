import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type AddOrganizationTeamMemberLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["organization/$slug/settings/team/add-member"];

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

export async function inviteProfileToJoinOrganization(
  organizationId: string,
  profileId: string
): Promise<{
  error: Error | null;
  value?: {
    profile: { firstName: string; lastName: string; email: string };
    organization: { name: string };
  };
}> {
  const profile = await prismaClient.profile.findFirst({
    where: {
      id: profileId,
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  const organization = await prismaClient.organization.findFirst({
    where: {
      id: organizationId,
    },
    select: {
      name: true,
    },
  });

  if (profile === null || organization === null) {
    return { error: new Error("Profile or organization not found") };
  }

  await prismaClient.inviteForProfileToJoinOrganization.upsert({
    where: {
      profileId_organizationId_role: {
        profileId,
        organizationId,
        role: "member",
      },
    },
    create: {
      profileId,
      organizationId,
      role: "member",
      status: "pending",
    },
    update: {
      status: "pending",
    },
  });

  return { error: null, value: { profile, organization } };
}
