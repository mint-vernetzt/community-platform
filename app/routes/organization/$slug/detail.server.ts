import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { filterOrganizationByVisibility } from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type OrganizationDetailLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["organization/$slug/detail"];

export async function getOrganization(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      background: true,
      logo: true,
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
      types: {
        select: {
          organizationType: {
            select: {
              slug: true,
            },
          },
        },
      },
      networkTypes: {
        select: {
          networkType: {
            select: {
              slug: true,
            },
          },
        },
      },
      networkMembers: {
        select: {
          networkMember: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              organizationVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
                },
              },
            },
          },
        },
      },
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
          name: true,
          slug: true,
          bio: true,
          background: true,
          logo: true,
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
          networkTypes: true,
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
  const networkMembers = filteredOrganization.networkMembers.map((relation) => {
    const filteredNetworkMember = filterOrganizationByVisibility<
      typeof relation.networkMember
    >(relation.networkMember);
    return {
      ...relation,
      networkMember: filteredNetworkMember,
    };
  });
  return {
    ...filteredOrganization,
    networkMembers,
  };
}

export function addImgUrls(
  authClient: SupabaseClient,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  let background = organization.background;
  let blurredBackground;
  if (background !== null) {
    const publicURL = getPublicURL(authClient, background);
    background = getImageURL(publicURL, {
      resize: { type: "fill", ...ImageSizes.Organization.Detail.Background },
    });
    blurredBackground = getImageURL(publicURL, {
      resize: {
        type: "fill",
        ...ImageSizes.Organization.Detail.BlurredBackground,
      },
      blur: BlurFactor,
    });
  }
  let logo = organization.logo;
  let blurredLogo;
  if (logo !== null) {
    const publicURL = getPublicURL(authClient, logo);
    logo = getImageURL(publicURL, {
      resize: { type: "fill", ...ImageSizes.Organization.Detail.Logo },
    });
    blurredLogo = getImageURL(publicURL, {
      resize: { type: "fill", ...ImageSizes.Organization.Detail.BlurredLogo },
      blur: BlurFactor,
    });
  }
  const networkMembers = organization.networkMembers.map((relation) => {
    let logo = relation.networkMember.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      logo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Organization.Detail.NetworkLogo },
      });
      blurredLogo = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Organization.Detail.BlurredNetworkLogo,
        },
        blur: BlurFactor,
      });
    }
    return {
      ...relation,
      networkMember: {
        ...relation.networkMember,
        logo,
        blurredLogo,
      },
    };
  });
  return {
    ...organization,
    networkMembers,
    background,
    blurredBackground,
    logo,
    blurredLogo,
  };
}
