import { prismaClient } from "~/prisma.server";

export async function getProfileByUserId(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
    where: {
      id,
    },
  });
}
