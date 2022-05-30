import { Area, Profile, State } from "@prisma/client";
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
  areas: ProfileFormType["areas"];
  offers: ProfileFormType["offers"];
  seekings: ProfileFormType["seekings"];
};
export async function updateProfileByUserId(id: string, data: UpdateProfile) {
  const { areas, offers, seekings, ...rest } = data;

  const result = await prismaClient.profile.update({
    where: {
      id,
    },
    data: {
      ...rest,
      areas: {
        deleteMany: {},
        connectOrCreate: areas.map((areaId) => ({
          where: {
            profileId_areaId: { areaId, profileId: id },
          },
          create: {
            areaId,
          },
        })),
      },
      offers: {
        deleteMany: {},
        connectOrCreate: offers.map((offerId) => ({
          where: {
            profileId_offerId: { offerId, profileId: id },
          },
          create: {
            offerId,
          },
        })),
      },
      seekings: {
        deleteMany: {},
        connectOrCreate: seekings.map((offerId) => ({
          where: {
            profileId_offerId: { offerId, profileId: id },
          },
          create: {
            offerId,
          },
        })),
      },
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
