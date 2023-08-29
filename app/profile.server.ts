import type {
  Area,
  AreaType,
  Offer,
  Prisma,
  Profile,
  State,
} from "@prisma/client";
import { prismaClient } from "./prisma.server";
import type { ProfileFormType } from "./routes/profile/$username/settings/general";

export type ProfileWithRelations = Profile & {
  areas?: Area[];
  seekings?: Offer[];
  offers?: Offer[];
};

type FieldType = keyof ProfileWithRelations;

export async function getProfileByUsername(username: string) {
  const profile = await prismaClient.profile.findUnique({
    where: { username },
    include: {
      areas: { select: { area: { select: { name: true } } } },
      offers: { select: { offer: { select: { title: true } } } },
      seekings: { select: { offer: { select: { title: true } } } },
      memberOf: {
        select: {
          organization: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
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
        orderBy: {
          organization: {
            name: "asc",
          },
        },
      },
      teamMemberOfProjects: {
        select: {
          project: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              awards: {
                select: {
                  award: {
                    select: {
                      id: true,
                      title: true,
                      shortTitle: true,
                      date: true,
                      logo: true,
                    },
                  },
                },
              },
              responsibleOrganizations: {
                select: {
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          project: {
            name: "asc",
          },
        },
      },
    },
  });

  return profile;
}

export async function getProfileByUserId(id: string, fields: FieldType[] = []) {
  const where = { id };

  const select = fields.reduce(
    (
      acc: {
        [key: string]: boolean | { select: { [key: string]: boolean } };
      },
      elem: FieldType
    ) => {
      if (elem === "areas") {
        acc[elem] = { select: { areaId: true } };
      } else if (elem === "seekings" || elem === "offers") {
        acc[elem] = { select: { offerId: true } };
      } else {
        acc[elem] = true;
      }
      return acc;
    },
    {}
  );

  let query: {
    select?: Prisma.ProfileSelect;
    where: Prisma.ProfileWhereUniqueInput;
  } = { where };
  if (fields.length > 0) {
    query = { ...query, select };
  }

  const result = await prismaClient.profile.findUnique(query);

  return result as ProfileWithRelations;
}

type UpdateProfile = Partial<Profile> & {
  areas?: ProfileFormType["areas"];
  offers?: ProfileFormType["offers"];
  seekings?: ProfileFormType["seekings"];
};
export async function updateProfileByUserId(id: string, data: UpdateProfile) {
  const { areas, offers, seekings, ...rest } = data;
  let areasQuery, offersQuery, seekingsQuery;

  if (areas !== undefined) {
    areasQuery = {
      deleteMany: {},
      connectOrCreate: areas.map((areaId) => ({
        where: {
          profileId_areaId: { areaId, profileId: id },
        },
        create: {
          areaId,
        },
      })),
    };
  }
  if (offers !== undefined) {
    offersQuery = {
      deleteMany: {},
      connectOrCreate: offers.map((offerId) => ({
        where: {
          profileId_offerId: { offerId, profileId: id },
        },
        create: {
          offerId,
        },
      })),
    };
  }
  if (seekings !== undefined) {
    seekingsQuery = {
      deleteMany: {},
      connectOrCreate: seekings.map((offerId) => ({
        where: {
          profileId_offerId: { offerId, profileId: id },
        },
        create: {
          offerId,
        },
      })),
    };
  }

  const result = await prismaClient.profile.update({
    where: {
      id,
    },
    data: {
      ...rest,
      areas: areasQuery,
      offers: offersQuery,
      seekings: seekingsQuery,
      updatedAt: new Date(),
    },
  });

  return result;
}

export async function createOrganizationOnProfile(
  profileId: string,
  organizationName: string,
  organizationSlug: string
) {
  const [profile /*, organization*/] = await prismaClient.$transaction([
    prismaClient.profile.update({
      where: {
        id: profileId,
      },
      data: {
        memberOf: {
          create: {
            isPrivileged: true,
            organization: {
              create: {
                name: organizationName,
                slug: organizationSlug,
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

export async function getAllDistricts() {
  return await prismaClient.district.findMany();
}

export type AreasWithState = (Area & {
  state: State | null;
})[];

export async function getAreaById(areaId: string) {
  return await prismaClient.area.findUnique({
    where: {
      id: areaId,
    },
    select: {
      id: true,
      type: true,
      stateId: true,
    },
  });
}

export async function getAllProfiles() {
  const profiles = await prismaClient.profile.findMany({
    select: {
      username: true,
      firstName: true,
      lastName: true,
      academicTitle: true,
      position: true,
      bio: true,
      avatar: true,
      background: true,
      areas: { select: { area: { select: { name: true } } } },
    },
  });
  return profiles;
}

export async function getAllOffers() {
  return await prismaClient.offer.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      title: true,
    },
  });
}

export async function deleteProfileByUserId(id: string) {
  return await prismaClient.profile.delete({ where: { id } });
}

export async function getFilteredProfiles(
  areaToFilter:
    | { id: string; type: AreaType; stateId: string | null }
    | null
    | undefined,
  offerId: string | undefined,
  seekingId: string | undefined
) {
  let queries = [];
  let areaQuery = {};
  let offerQuery = {};
  let seekingQuery = {};

  if (areaToFilter) {
    if (areaToFilter.type === "country") {
      areaQuery = {
        areas: {
          some: {},
        },
      };
      // TODO: Order by area type: country -> state -> district
    } else if (areaToFilter.type === "state") {
      areaQuery = {
        OR: [
          {
            areas: {
              some: {
                area: {
                  stateId: areaToFilter.stateId,
                },
              },
            },
          },
          {
            areas: {
              some: {
                area: {
                  type: "country",
                },
              },
            },
          },
        ],
      };
      // TODO: Order by area type: state -> district -> country
    } else if (areaToFilter.type === "district") {
      areaQuery = {
        OR: [
          {
            areas: {
              some: {
                area: {
                  id: areaToFilter.id,
                },
              },
            },
          },
          {
            areas: {
              some: {
                area: {
                  type: "state",
                  stateId: areaToFilter.stateId,
                },
              },
            },
          },
          {
            areas: {
              some: {
                area: {
                  type: "country",
                },
              },
            },
          },
        ],
      };
      // TODO: Order by area type: district -> state -> country
    }
    queries.push(areaQuery);
  }

  if (offerId) {
    offerQuery = {
      offers: {
        some: {
          offer: {
            id: offerId,
          },
        },
      },
    };
    queries.push(offerQuery);
  }

  if (seekingId) {
    seekingQuery = {
      seekings: {
        some: {
          offer: {
            id: seekingId,
          },
        },
      },
    };
    queries.push(seekingQuery);
  }
  const result = await prismaClient.profile.findMany({
    where: {
      AND: queries,
    },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      academicTitle: true,
      position: true,
      bio: true,
      avatar: true,
      areas: {
        select: { area: { select: { name: true, type: true, stateId: true } } },
      },
    },
    // TODO: Add orderBy
  });
  return result;
}

/*
function createListUpdateQueryPart(profileId: String, ) {
  const listUpdates = [
    { listName: "areas", listId: "areaId", list: areas },
    { listName: "offers", listId: "offerId", list: offers },
    { listName: "seekings", listId: "offerId", list: seekings },
  ].map(({ listName, listId, list }) => ({
    [listName]: {
      deleteMany: {},
      connectOrCreate: list.map((createId) => ({
        where: {
          [`profileId_${listId}`]: { [listId]: createId, profileId },
        },
        create: {
          [listId]: createId,
        },
      })),
    },
  }));
}
*/
