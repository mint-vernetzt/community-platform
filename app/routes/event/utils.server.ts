import { prismaClient } from "~/prisma";

export async function createEventOnProfile(
  profileId: string,
  eventOptions: {
    slug: string;
    name: string;
    startTime: Date;
    endTime: Date;
    participationUntil: Date;
  }
) {
  const profile = prismaClient.profile.update({
    where: {
      id: profileId,
    },
    data: {
      teamMemberOfEvents: {
        create: {
          isPrivileged: true,
          event: {
            create: {
              ...eventOptions,
            },
          },
        },
      },
    },
  });
  return profile;
}
