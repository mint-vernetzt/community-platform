import { prismaClient } from "~/prisma.server";

async function main() {
  const profiles = await prismaClient.profile.findMany({
    where: {
      notificationSettings: {
        is: null,
      },
    },
    select: {
      id: true,
    },
  });
  if (profiles.length === 0) {
    console.log("No profiles found without notification settings.");
    return;
  }
  for (const profile of profiles) {
    await prismaClient.profile.update({
      where: {
        id: profile.id,
      },
      data: {
        notificationSettings: {
          create: {},
        },
      },
    });
  }
  const profilesCount = await prismaClient.profile.count();
  console.log(
    `Created notification settings for ${profiles.length} of ${profilesCount} profiles.`
  );
}

main()
  .catch(console.error)
  .finally(() => {
    prismaClient.$disconnect();
    console.log("Done.");
  });
