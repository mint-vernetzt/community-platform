import { filterOrganizationByVisibility } from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";

export async function getOrganization(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    select: {
      id: true,
      bio: true,
      supportedBy: true,
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
      instagram: true,
      youtube: true,
      mastodon: true,
      tiktok: true,
      xing: true,
      areas: {
        select: {
          area: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
      organizationVisibility: {
        select: {
          bio: true,
          supportedBy: true,
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
          instagram: true,
          youtube: true,
          mastodon: true,
          tiktok: true,
          xing: true,
          areas: true,
          focuses: true,
        },
      },
    },
    where: {
      slug,
    },
  });

  return organization;
}

export function filterOrganization(
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  const filteredOrganization =
    filterOrganizationByVisibility<typeof organization>(organization);

  return filteredOrganization;
}
