import type { Profile } from "@prisma/client";
import { prismaClient } from "~/prisma";

export async function createProfile(
  data: Pick<
    Profile,
    "id" | "username" | "email" | "firstName" | "lastName" | "termsAccepted"
  >
) {
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
