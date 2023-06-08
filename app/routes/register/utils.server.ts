import { Profile } from "@prisma/client";
import { prismaClient } from "~/prisma";

export async function createProfile(
  data: Pick<
    Profile,
    "id" | "username" | "email" | "firstName" | "lastName" | "termsAccepted"
  >
) {
  // TODO: How to connect and create one-to-one relations
  const [profileVisibilities, profile] = await prismaClient.$transaction([
    prismaClient.profileVisibility.create({
      data: {
        profileId: data.id,
      },
    }),
    prismaClient.profile.create({
      data: {
        ...data,
      },
    }),
  ]);
  return profile;
}
