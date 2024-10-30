import type { Organization } from "@prisma/client";
import { json } from "@remix-run/server-runtime";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { triggerEntityScore } from "~/utils.server";

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
      teamMemberOfEvents: {
        select: {
          event: {
            select: {
              id: true,
            },
          },
        },
      },
      teamMemberOfProjects: {
        select: {
          project: {
            select: {
              id: true,
            },
          },
        },
      },
      contributedEvents: {
        select: {
          event: {
            select: {
              id: true,
            },
          },
        },
      },
      participatedEvents: {
        select: {
          event: {
            select: {
              id: true,
            },
          },
        },
      },
      waitingForEvents: {
        select: {
          event: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
  return profile;
}

export async function getProfileByEmailCaseInsensitive(email: string) {
  const profile = await prismaClient.profile.findFirst({
    where: {
      email: {
        contains: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      username: true,
    },
  });
  return profile;
}

export async function getWholeOrganizationBySlug(slug: string) {
  const organization = await prismaClient.organization.findFirst({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      street: true,
      streetNumber: true,
      zipCode: true,
      city: true,
      bio: true,
      supportedBy: true,
      quote: true,
      quoteAuthor: true,
      quoteAuthorInformation: true,
      website: true,
      linkedin: true,
      twitter: true,
      xing: true,
      instagram: true,
      youtube: true,
      facebook: true,
      mastodon: true,
      tiktok: true,
      types: {
        select: {
          organizationTypeId: true,
        },
      },
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
    },
  });
  return organization;
}

export async function getOrganizationTypes() {
  const organizationTypes = await prismaClient.organizationType.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return organizationTypes;
}

export async function getOrganizationIdBySlug(slug: string) {
  const organization = await prismaClient.organization.findFirst({
    select: { id: true },
    where: { slug },
  });
  return organization;
}

export async function getOrganizationByName(name: string) {
  const organization = await prismaClient.organization.findFirst({
    where: { name },
    select: {
      id: true,
      slug: true,
      logo: true,
      name: true,
      memberOf: {
        select: {
          network: {
            select: {
              slug: true,
            },
          },
        },
      },
      types: {
        select: {
          organizationType: {
            select: {
              title: true,
            },
          },
        },
      },
      responsibleForEvents: {
        select: {
          event: {
            select: {
              id: true,
            },
          },
        },
      },
      responsibleForProject: {
        select: {
          project: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
  return organization;
}

export async function getOrganizationById(id: string) {
  const organization = await prismaClient.organization.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      memberOf: {
        select: {
          network: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });
  return organization;
}

export async function updateOrganizationById(
  id: string,
  organizationData: Omit<
    Organization,
    "id" | "slug" | "logo" | "background" | "createdAt" | "updatedAt" | "score"
  > & {
    areas: string[];
  } & {
    types: string[];
  } & {
    focuses: string[];
  },
  privateFields: string[]
) {
  const organizationVisibility =
    await prismaClient.organizationVisibility.findFirst({
      where: {
        organization: {
          id,
        },
      },
    });
  if (organizationVisibility === null) {
    throw json("Organization visibilities not found", { status: 404 });
  }

  let visibility: keyof typeof organizationVisibility;
  for (visibility in organizationVisibility) {
    if (
      visibility !== "id" &&
      visibility !== "organizationId" &&
      organizationData.hasOwnProperty(visibility)
    ) {
      organizationVisibility[visibility] = !privateFields.includes(
        `${visibility}`
      );
    }
  }
  await prismaClient.$transaction([
    prismaClient.organization.update({
      where: {
        id,
      },
      data: {
        ...organizationData,
        types: {
          deleteMany: {},
          connectOrCreate: organizationData.types.map((typeId) => {
            return {
              where: {
                organizationId_organizationTypeId: {
                  organizationTypeId: typeId,
                  organizationId: id,
                },
              },
              create: {
                organizationTypeId: typeId,
              },
            };
          }),
        },
        focuses: {
          deleteMany: {},
          connectOrCreate: organizationData.focuses.map((focusId) => {
            return {
              where: {
                organizationId_focusId: {
                  focusId,
                  organizationId: id,
                },
              },
              create: {
                focusId,
              },
            };
          }),
        },
        areas: {
          deleteMany: {},
          connectOrCreate: organizationData.areas.map((areaId) => {
            return {
              where: {
                organizationId_areaId: {
                  areaId,
                  organizationId: id,
                },
              },
              create: {
                areaId,
              },
            };
          }),
        },
      },
    }),
    prismaClient.organizationVisibility.update({
      where: {
        id: organizationVisibility.id,
      },
      data: organizationVisibility,
    }),
  ]);
  await triggerEntityScore({ entity: "organization", where: { id } });

  updateFilterVectorOfOrganization(id);
}

export async function updateFilterVectorOfOrganization(organizationId: string) {
  const organization = await prismaClient.organization.findFirst({
    where: { id: organizationId },
    select: {
      id: true,
      slug: true,
      types: {
        select: {
          organizationType: {
            select: {
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
      areas: {
        select: {
          area: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });
  if (organization !== null) {
    if (
      organization.types.length === 0 &&
      organization.focuses.length === 0 &&
      organization.areas.length === 0
    ) {
      await prismaClient.$queryRawUnsafe(
        `update profiles set filter_vector = NULL where id = '${organization.id}'`
      );
    } else {
      const typeVectors = organization.types.map(
        (relation) => `type:${relation.organizationType.slug}`
      );
      const focusVectors = organization.focuses.map(
        (relation) => `focus:${relation.focus.slug}`
      );
      const areaVectors = organization.areas.map(
        (relation) => `area:${relation.area.slug}`
      );
      const vectors = [...typeVectors, ...focusVectors, ...areaVectors];
      const vectorString = `{"${vectors.join(`","`)}"}`;
      const query = `update organizations set filter_vector = array_to_tsvector('${vectorString}') where id = '${organization.id}'`;
      await prismaClient.$queryRawUnsafe(query);
    }
  }
}

export async function connectOrganizationToNetwork(
  organizationId: string,
  networkId: string
) {
  const result = await prismaClient.memberOfNetwork.create({
    data: {
      networkMemberId: organizationId,
      networkId,
    },
  });
  return result;
}

export async function disconnectOrganizationFromNetwork(
  organizationId: string,
  networkId: string
) {
  const result = await prismaClient.memberOfNetwork.delete({
    where: {
      networkId_networkMemberId: {
        networkId,
        networkMemberId: organizationId,
      },
    },
  });
  return result;
}

export async function getNetworkMembersOfOrganization(
  authClient: SupabaseClient,
  organizationId: string
) {
  const networkMembers = await prismaClient.memberOfNetwork.findMany({
    select: {
      networkId: true,
      networkMember: {
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
        },
      },
    },
    where: {
      networkId: organizationId,
    },
    orderBy: {
      networkMember: {
        name: "asc",
      },
    },
  });

  const enhancedNetworkMembers = networkMembers.map((relation) => {
    let logo = relation.networkMember.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItemEventAndOrganizationSettings
              .Logo,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItemEventAndOrganizationSettings
              .BlurredLogo,
          },
          blur: BlurFactor,
        });
      }
    }
    return {
      ...relation,
      networkMember: { ...relation.networkMember, logo, blurredLogo },
    };
  });

  return enhancedNetworkMembers;
}
