import { prismaClient } from "~/prisma.server";

export async function getProfileById(id: string) {
  const profile = await prismaClient.profile.findUnique({
    where: { id },
    select: {
      username: true,
    },
  });

  return profile;
}

export async function updateProfileEmailByUserId(id: string, email: string) {
  const result = await prismaClient.profile.update({
    select: {
      username: true,
    },
    where: {
      id,
    },
    data: {
      email,
    },
  });

  return result;
}
