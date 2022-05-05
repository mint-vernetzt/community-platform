import { Area, Profile, State } from "@prisma/client";
import { prismaClient } from "./prisma";
import { ProfileFormType } from "./routes/profile/$username/edit/yupSchema";

type FieldType = keyof Profile;

export async function getProfileByUsername(
  username: string,
  fields: FieldType[] = []
) {
  const where = { username };
  const include = {
    areas: true,
    area: { select: { name: true } },
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
        areas: { select: { areaId: true, area: { select: { name: true } } } },
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

export async function getProfileByUserId(id: string, fields: FieldType[] = []) {
  const where = { id };
  const include = {
    areas: true,
    area: { select: { name: true } },
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
};
export async function updateProfileByUserId(id: string, data: UpdateProfile) {
  const { areas, ...rest } = data;

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
