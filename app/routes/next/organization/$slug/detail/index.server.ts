import { filterOrganizationByVisibility } from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";

export async function getOrganization(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    select: {
      id: true,
      bio: true,
      email: true,
      phone: true,
      website: true,
      city: true,
      street: true,
      streetNumber: true,
      zipCode: true,
      facebook: true,
      linkedin: true,
      twitter: true,
      xing: true,
      instagram: true,
      youtube: true,
      mastodon: true,
      tiktok: true,
      supportedBy: true,
      areas: {
        select: {
          areaId: true,
        },
      },
      focuses: {
        select: {
          focusId: true,
        },
      },
      networkMembers: {
        select: {
          networkMemberId: true,
        },
      },
      memberOf: {
        select: {
          networkId: true,
        },
      },
      teamMembers: {
        select: {
          profileId: true,
        },
      },
      responsibleForEvents: {
        select: {
          eventId: true,
        },
      },
      responsibleForProject: {
        select: {
          projectId: true,
        },
      },
      organizationVisibility: {
        select: {
          bio: true,
          email: true,
          phone: true,
          website: true,
          city: true,
          street: true,
          streetNumber: true,
          zipCode: true,
          facebook: true,
          linkedin: true,
          twitter: true,
          xing: true,
          instagram: true,
          youtube: true,
          mastodon: true,
          tiktok: true,
          supportedBy: true,
          types: true,
          areas: true,
          focuses: true,
          memberOf: true,
          responsibleForEvents: true,
          responsibleForProject: true,
          teamMembers: true,
          networkMembers: true,
        },
      },
    },
    where: {
      slug: slug,
    },
  });
  return organization;
}

export function filterOrganization(
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  const filteredOrganization =
    filterOrganizationByVisibility<typeof organization>(organization);
  return {
    ...filteredOrganization,
  };
}
