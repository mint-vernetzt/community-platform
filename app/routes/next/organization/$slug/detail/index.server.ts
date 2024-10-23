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
      _count: {
        select: {
          areas: true,
          focuses: true,
          networkMembers: true,
          memberOf: true,
          teamMembers: true,
          responsibleForEvents: {
            where: {
              event: {
                published: true,
              },
            },
          },
          responsibleForProject: {
            where: {
              project: {
                published: true,
              },
            },
          },
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
