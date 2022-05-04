import { Profile } from "@prisma/client";
import { create } from "cypress/types/lodash";
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

type UpdateProfile = Partial<Profile> & {
  areas: Pick<ProfileFormType, "areas">;
};
export async function updateProfileByUserId(id: string, data: UpdateProfile) {
  const { areas, ...rest } = data;
  /*
  let areaConnections = areas.reduce(
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
  */

  const result = await prismaClient.profile.update({
    where: {
      id,
    },
    data: {
      ...rest,
      areas: {
        connectOrCreate: [
          {
            where: {
              profileId_areaId: { areaId: 2, profileId: id },
            },
            create: {
              areaId: 2,
            },
          },
        ],
      },
    },
  });

  return result;
}

export async function getAllDistricts() {
  return await prismaClient.district.findMany();
}

export async function getStatesWithDistricts() {
  return await prismaClient.area.findMany({
    include: {
      state: true,
    },
  });
}
