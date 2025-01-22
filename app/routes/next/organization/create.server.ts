import { type Organization, type Prisma } from "@prisma/client";
import { prismaClient } from "~/prisma.server";

export async function createOrganizationOnProfile(
  profileId: string,
  submissionValues: {
    organizationName: string;
    networkTypes: string[];
    organizationTypes: string[];
  },
  organizationSlug: string
) {
  const { organizationName, networkTypes, organizationTypes } =
    submissionValues;
  const [profile] = await prismaClient.$transaction([
    prismaClient.profile.update({
      where: {
        id: profileId,
      },
      data: {
        memberOf: {
          create: {
            organization: {
              create: {
                name: organizationName,
                slug: organizationSlug,
                types: {
                  create: organizationTypes.map((typeId) => ({
                    organizationType: {
                      connect: {
                        id: typeId,
                      },
                    },
                  })),
                },
                networkTypes: {
                  create: networkTypes.map((typeId) => ({
                    networkType: {
                      connect: {
                        id: typeId,
                      },
                    },
                  })),
                },
                organizationVisibility: {
                  create: {},
                },
              },
            },
          },
        },
      },
    }),
    prismaClient.organization.update({
      where: {
        slug: organizationSlug,
      },
      data: {
        admins: {
          create: {
            profileId: profileId,
          },
        },
      },
    }),
  ]);
  return profile;
}

export async function searchForOrganizationsByName(query: string[]) {
  const whereQueries: {
    OR: {
      [K in Organization as string]: {
        contains: string;
        mode: Prisma.QueryMode;
      };
    }[];
  }[] = [];
  for (const word of query) {
    whereQueries.push({
      OR: [{ name: { contains: word, mode: "insensitive" } }],
    });
  }
  const searchResult = await prismaClient.organization.findMany({
    where: {
      AND: whereQueries,
    },
    select: {
      id: true,
      name: true,
      slug: true,
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
    take: 5,
  });
  return searchResult;
}

export async function countOrganizationsBySearchQuery(query: string[]) {
  const whereQueries: {
    OR: {
      [K in Organization as string]: {
        contains: string;
        mode: Prisma.QueryMode;
      };
    }[];
  }[] = [];
  for (const word of query) {
    whereQueries.push({
      OR: [{ name: { contains: word, mode: "insensitive" } }],
    });
  }
  const count = await prismaClient.organization.count({
    where: {
      AND: whereQueries,
    },
  });
  return count;
}

export async function getAllOrganizationTypes() {
  const allOrganizationTypes = await prismaClient.organizationType.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return allOrganizationTypes;
}

export async function getAllNetworkTypes() {
  const allNetworkTypes = await prismaClient.networkType.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return allNetworkTypes;
}

export async function getOrganizationTypesWithSlugs(ids: string[]) {
  const organizationTypes = await prismaClient.organizationType.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      slug: true,
    },
  });
  return organizationTypes;
}
