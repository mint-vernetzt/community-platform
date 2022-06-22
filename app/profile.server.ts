import { Area, Prisma, Profile, State } from "@prisma/client";
import { orderBy } from "cypress/types/lodash";
import { prismaClient } from "./prisma";
import { ProfileFormType } from "./routes/profile/$username/edit/yupSchema";

type FieldType = keyof Profile;

export async function getProfileByUsername(username: string) {
  const where = { username };
  const include = {
    areas: { select: { area: { select: { name: true } } } },
    offers: { select: { offer: { select: { title: true } } } },
    seekings: { select: { offer: { select: { title: true } } } },
  };

  const profile = await prismaClient.profile.findUnique({
    where,
    include,
  });

  return profile;
}

export async function getProfileByUserId(id: string, fields: FieldType[] = []) {
  const where = { id };
  const include = {
    areas: { select: { areaId: true } },
    seekings: { select: { offerId: true } },
    offers: { select: { offerId: true } },
  };

  if (fields.length > 0) {
    /**
     * build select object {KEYn: true} from list of allowed profile fields
     */
    let select = fields.reduce(
      (
        acc: {
          [key: string]: boolean;
        },
        elem: FieldType
      ) => {
        acc[elem] = true;
        return acc;
      },
      {}
    );

    return await prismaClient.profile.findUnique({
      select: {
        ...select,
        areas: { select: { areaId: true } },
        seekings: { select: { offerId: true } },
        offers: { select: { offerId: true } },
      },
      where,
    });
  } else {
    return await prismaClient.profile.findUnique({
      where,
      include,
    });
  }
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
    },
  });

  return result;
}

export async function getAllDistricts() {
  return await prismaClient.district.findMany();
}

export type AreasWithState = (Area & {
  state: State | null;
})[];

export async function getAreas(): Promise<AreasWithState> {
  return await prismaClient.area.findMany({
    include: {
      state: true,
    },
  });
}

export async function getAllProfiles() {
  const profiles = await prismaClient.profile.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      username: true,
      firstName: true,
      lastName: true,
      academicTitle: true,
      position: true,
      bio: true,
      publicFields: true,
      areas: { select: { area: { select: { name: true } } } },
    },
  });
  return profiles;
}

export async function getNumberOfProfilesWithTheSameName(
  firstName: string,
  lastName: string
) {
  const numberOfProfilesWithSameName = await prismaClient.profile.count({
    where: { firstName, lastName },
  });
  return numberOfProfilesWithSameName;
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
  areaId: string | undefined,
  offerId: string | undefined,
  seekingId: string | undefined
) {
  let queries = [],
    areaQuery,
    offerQuery,
    seekingQuery;

  if (areaId) {
    const areaToFilter = await prismaClient.area.findUnique({
      where: {
        id: areaId,
      },
      select: {
        type: true,
        stateId: true,
      },
    });

    if (areaToFilter) {
      if (areaToFilter.type === "country") {
        areaQuery = {
          areas: {
            some: {},
          },
        };
        // TODO: Order by area type: country -> state -> district
      }
      if (areaToFilter.type === "state") {
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
      }
      if (areaToFilter.type === "district") {
        areaQuery = {
          OR: [
            {
              areas: {
                some: {
                  area: {
                    id: areaId,
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

  return await prismaClient.profile.findMany({
    where: {
      AND: queries, // TODO: Solve type issue
    },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      academicTitle: true,
      position: true,
      bio: true,
      areas: { select: { area: { select: { name: true } } } },
    },
    // TODO: Add orderBy
  });
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
