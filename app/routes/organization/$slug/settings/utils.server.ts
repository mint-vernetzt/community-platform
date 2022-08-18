import { Organization } from "@prisma/client";
import { DataFunctionArgs } from "@remix-run/server-runtime";
import { GravityType } from "imgproxy/dist/types";
import { badRequest, forbidden, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma";
import { getPublicURL } from "~/storage.server";

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

export async function getFocuses() {
  const focuses = await prismaClient.focus.findMany();
  return focuses;
}

export async function getAreas() {
  return await prismaClient.area.findMany({
    include: {
      state: true,
    },
  });
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
    },
  });
  return organization;
}

export async function updateOrganizationById(
  id: string,
  data: Omit<
    Organization,
    "id" | "slug" | "logo" | "background" | "createdAt" | "updatedAt"
  > & {
    areas: string[];
  } & {
    types: string[];
  } & {
    focuses: string[];
  }
) {
  await prismaClient.organization.update({
    where: {
      id,
    },
    data: {
      ...data,
      types: {
        deleteMany: {},
        connectOrCreate: data.types.map((typeId) => {
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
        connectOrCreate: data.focuses.map((focusId) => {
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
        connectOrCreate: data.areas.map((areaId) => {
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
  });
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
  console.log(result);
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

export async function getMembersOfOrganization(organizationId: string) {
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
  });

  const enhancedMembers = members.map((item) => {
    if (item.profile.avatar !== null) {
      const publicURL = getPublicURL(item.profile.avatar);
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

export async function getNetworkMembersOfOrganization(organizationId: string) {
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
  });

  const enhancedNetworkMembers = networkMembers.map((item) => {
    if (item.networkMember.logo !== null) {
      const publicURL = getPublicURL(item.networkMember.logo);
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

export async function handleAuthorization(args: DataFunctionArgs) {
  const { params, request } = args;

  const { slug } = params;

  if (slug === undefined) {
    throw badRequest({ message: "Organization slug missing" });
  }

  const currentUser = await getUserByRequest(request);

  if (currentUser === null) {
    throw forbidden({ message: "forbidden" });
  }

  const organization = await getOrganizationIdBySlug(slug);
  if (organization === null) {
    throw notFound({
      message: `Couldn't find organization with slug "${slug}"`,
    });
  }

  const isAllowedToModify = await allowedToModify(
    currentUser.id,
    organization.id
  );

  if (isAllowedToModify === false) {
    throw forbidden({ message: "forbidden" });
  }

  return {
    currentUser,
    isAllowedToModify,
    organization,
    slug,
  };
}
