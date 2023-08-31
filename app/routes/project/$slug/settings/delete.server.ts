import { prismaClient } from "~/prisma.server";

export async function getProfileByUserId(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      username: true,
    },
    where: {
      id,
    },
  });
}
