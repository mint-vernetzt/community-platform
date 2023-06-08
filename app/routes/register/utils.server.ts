import { prismaClient } from "~/prisma";

export async function createProfileVisibilities(id: string) {
  await prismaClient.profileVisibility.create({
    data: {
      profileId: id,
    },
  });
}
