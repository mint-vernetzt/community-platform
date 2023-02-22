import { prismaClient } from "../../../app/prisma";

export async function connectProfileWithArea(
  profileId: string,
  areaId: string
) {
  await prismaClient.areasOnProfiles.create({
    data: {
      areaId: areaId,
      profileId: profileId,
    },
  });
}
