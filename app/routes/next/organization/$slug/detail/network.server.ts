import { type SupabaseClient } from "@supabase/supabase-js";
import { getImageURL, ImageSizes } from "~/images.server";
import { filterOrganizationByVisibility } from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getOrganization(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    select: {
      id: true,
      networkMembers: {
        select: {
          networkMember: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
              organizationVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
                  types: true,
                },
              },
            },
          },
        },
        orderBy: {
          networkMember: {
            name: "asc",
          },
        },
      },
      memberOf: {
        select: {
          network: {
            select: {
              id: true,
              slug: true,
              name: true,
              logo: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
              organizationVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
                  types: true,
                },
              },
            },
          },
        },
        orderBy: {
          network: {
            name: "asc",
          },
        },
      },
      organizationVisibility: {
        select: {
          networkMembers: true,
          memberOf: true,
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

  const memberOf = filteredOrganization.memberOf.map((relation) => {
    const filteredNetwork = filterOrganizationByVisibility<
      typeof relation.network
    >(relation.network);
    return {
      ...relation,
      network: filteredNetwork,
    };
  });

  return {
    ...filteredOrganization,
    networkMembers,
    memberOf,
  };
}

export function addImgUrls(
  authClient: SupabaseClient,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  const networkMembers = organization.networkMembers.map((relation) => {
    let logo = relation.networkMember.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      logo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Organization.ListItem.Logo },
      });
    }
    return {
      ...relation,
      networkMember: {
        ...relation.networkMember,
        logo,
      },
    };
  });

  const memberOf = organization.memberOf.map((relation) => {
    let logo = relation.network.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      logo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Organization.ListItem.Logo },
      });
    }
    return {
      ...relation,
      network: {
        ...relation.network,
        logo,
      },
    };
  });

  return {
    ...organization,
    networkMembers,
    memberOf,
  };
}
