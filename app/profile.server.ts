import { Profile } from "@prisma/client";

export async function getProfileByUsername(
  username: string
): Promise<Partial<Profile>> {
  return {
    firstName: "Peter",
  };
}

export async function updateProfileByUsername(
  username: string,
  data: Partial<Profile>
) {
  return true;
}
