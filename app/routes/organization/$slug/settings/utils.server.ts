import type { Organization } from "@prisma/client";
import type { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { GravityType } from "imgproxy/dist/types";
import { badRequest, forbidden, notFound } from "remix-utils";
import { getSessionUserOrThrow } from "~/auth.server";
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
      username: true,
    },
  });
  return profile;
}

export async function getProfileById(id: string) {
  const profile = await prismaClient.profile.findFirst({
    where: { id },
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
  });
  return profile;
}

export async function getWholeOrganizationBySlug(slug: string) {
  const organization = await prismaClient.organization.findFirst({
    where: {
      slug,
    },
    include: {
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
    include: {
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
    throw notFound("Organization visibilities not found");
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

export async function getMembersOfOrganization(
  authClient: SupabaseClient,
  organizationId: string
) {
  const members = await prismaClient.memberOfOrganization.findMany({
    select: {
      isPrivileged: true,
      organizationId: true,
      profile: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          position: true,
        },
      },
    },
    where: {
      organizationId: organizationId,
    },
    orderBy: {
      profile: {
        firstName: "asc",
      },
    },
  });

  const enhancedMembers = members.map((item) => {
    if (item.profile.avatar !== null) {
      const publicURL = getPublicURL(authClient, item.profile.avatar);
      if (publicURL !== null) {
        const avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
        return {
          ...item,
          profile: { ...item.profile, avatar },
        };
      }
    }
    return item;
  });

  return enhancedMembers;
}

export function getTeamMemberProfileDataFromOrganization(
  members: Awaited<ReturnType<typeof getMembersOfOrganization>>,
  currentUserId: string
) {
  const profileData = members.map((teamMember) => {
    const { isPrivileged, profile } = teamMember;
    const isCurrentUser = profile.id === currentUserId;
    return { isPrivileged, ...profile, isCurrentUser };
  });
  return profileData;
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
          gravity: GravityType.center,
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

export async function handleAuthorization(
  authClient: SupabaseClient,
  slug: string
) {
  if (slug === undefined) {
    throw badRequest({ message: "Organization slug missing" });
  }

  const sessionUser = await getSessionUserOrThrow(authClient);

  const organization = await getOrganizationIdBySlug(slug);
  if (organization === null) {
    throw notFound({
      message: `Couldn't find organization with slug "${slug}"`,
    });
  }

  const isAllowedToModify = await allowedToModify(
    sessionUser.id,
    organization.id
  );

  if (isAllowedToModify === false) {
    throw forbidden({ message: "forbidden" });
  }

  return {
    sessionUser,
    isAllowedToModify,
    organization,
    slug,
  };
}

export async function isOrganizationAdmin(
  slug: string,
  sessionUser: User | null
) {
  let isAdmin = false;
  if (sessionUser !== null) {
    const relation = await prismaClient.organization.findFirst({
      where: {
        slug,
        admins: {
          some: {
            profileId: sessionUser.id,
          },
        },
      },
    });
    if (relation !== null) {
      isAdmin = true;
    }
  }
  return isAdmin;
}
