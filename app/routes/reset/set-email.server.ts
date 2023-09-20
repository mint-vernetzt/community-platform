import { type Profile } from "@prisma/client";
import { prismaClient } from "~/prisma.server";

export async function updateProfileByUserId(
  id: string,
  data: Pick<Profile, "email">
) {
  const result = await prismaClient.profile.update({
    where: {
      id,
    },
    data: {
      ...data,
    },
  });

  return result;
}
