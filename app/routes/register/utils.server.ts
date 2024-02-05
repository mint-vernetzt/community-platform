import type { User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";

export async function createProfile(user: User) {
  if (
    user.email !== undefined &&
    typeof user.user_metadata.username === "string" &&
    typeof user.user_metadata.firstName === "string" &&
    typeof user.user_metadata.lastName === "string" &&
    (typeof user.user_metadata.academicTitle === "string" ||
      user.user_metadata.academicTitle === null) &&
    typeof user.user_metadata.termsAccepted === "boolean"
  ) {
    const initialProfile = {
      id: user.id,
      email: user.email,
      username: user.user_metadata.username,
      firstName: user.user_metadata.firstName,
      lastName: user.user_metadata.lastName,
      academicTitle: user.user_metadata.academicTitle,
      termsAccepted: user.user_metadata.termsAccepted,
    };
    // Creates the profile and its corrsponding profileVisibility with default values defined in prisma.schema
    const profile = await prismaClient.profile.create({
      data: {
        profileVisibility: {
          create: {},
        },
        notificationSettings: {
          create: {},
        },
        ...initialProfile,
      },
    });
    return profile;
  }
  return null;
}
