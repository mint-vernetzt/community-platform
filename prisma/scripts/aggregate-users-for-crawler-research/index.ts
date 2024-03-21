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

  let csv = "id,email,firstName,lastName,academicTitle\n";
  for (const profile of profiles) {
    csv += `${profile.id},${profile.email},${profile.firstName},${
      profile.lastName
    },${profile.academicTitle ?? ""}\n`;
  }

  fs.writeFile("profiles.csv", csv, "utf8");
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
