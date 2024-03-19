import { prismaClient } from "~/prisma.server";
import fs from "fs-extra";

async function main() {
  const profiles = await prismaClient.profile.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      academicTitle: true,
    },
    where: {
      notificationSettings: {
        updates: true,
      },
      email: {
        not: {
          contains: "@mint-vernetzt.de",
        },
      },
      memberOf: {
        none: {
          organization: {
            types: {
              some: {
                organizationType: {
                  title: "Stiftung",
                },
              },
            },
          },
        },
      },
    },
  });

  fs.writeFile("profiles.json", JSON.stringify(profiles, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
