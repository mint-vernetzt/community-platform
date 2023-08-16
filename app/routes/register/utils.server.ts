import type { Profile } from "@prisma/client";
import { prismaClient } from "~/prisma.server";

export async function createProfile(
  data: Pick<
    Profile,
    "id" | "username" | "email" | "firstName" | "lastName" | "termsAccepted"
  >
) {
  // Creates the profile and its corrsponding profileVisibility with default values defined in prisma.schema
  const profile = await prismaClient.profile.create({
    data: {
      profileVisibility: {
        create: {},
      },
      ...data,
    },
  });
  return profile;
}
