import type { Organization } from "@prisma/client";
import { json } from "@remix-run/server-runtime";
import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import imgproxy from "imgproxy/dist/types.js";
import { getImageURL } from "~/images.server";
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
  const organizationTypes = await prismaClient.organizationType.findMany();
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
  let organizationVisibility =
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
                  title: true,
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

  const enhancedNetworkMembers = networkMembers.map((item) => {
    if (item.networkMember.logo !== null) {
      const publicURL = getPublicURL(authClient, item.networkMember.logo);
      if (publicURL !== null) {
        const logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
          gravity: imgproxy.GravityType.center,
        });
        return {
          ...item,
          networkMember: { ...item.networkMember, logo },
        };
      }
    }
    return item;
  });

  return enhancedNetworkMembers;
}
