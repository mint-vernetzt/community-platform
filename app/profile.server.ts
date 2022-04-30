import { Profile } from "@prisma/client";
import { prismaClient } from "./prisma";

type FieldType = keyof Profile;

export async function getProfileByUsername(
  username: string,
  fields: FieldType[] = []
) {
  const where = { username };

  if (fields.length > 0) {
    /**
     * build select object {KEYn: true} from list of allowed profile fields
     */
    const select = fields.reduce(
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
      select,
      where,
    });
  } else {
    return await prismaClient.profile.findUnique({
      where,
    });
  }
}

export async function updateProfileByUsername(
  username: string,
  data: Partial<Profile>
) {
  const result = await prismaClient.profile.update({
    where: {
      username,
    },
    data,
  });

  return result;
}
