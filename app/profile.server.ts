import { Profile } from "@prisma/client";

export async function getProfileByUsername(
  username: string
): Promise<Partial<Profile>> {
  return {
    firstName: "Peter",
  };
}
