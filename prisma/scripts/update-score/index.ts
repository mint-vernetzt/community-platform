import { prismaClient } from "~/prisma.server";
import { getScoreOfEntity } from "./utils";

async function main() {
  const transactions = [];

  const profiles = await prismaClient.profile.findMany({
    include: { areas: true },
  });

  console.log(`Updating score of ${profiles.length} profiles.`);

  for (const profile of profiles) {
    const score = getScoreOfEntity(profile);
    const transaction = prismaClient.profile.update({
      where: {
        id: profile.id,
      },
      data: {
        score,
      },
    });
    transactions.push(transaction);
  }

  const organizations = await prismaClient.organization.findMany({
    include: { areas: true, types: true },
  });

  console.log(`Updating score of ${organizations.length} organizations.`);

  for (const organization of organizations) {
    const score = getScoreOfEntity(organization);
    const transaction = prismaClient.organization.update({
      where: {
        id: organization.id,
      },
      data: {
        score,
      },
    });
    transactions.push(transaction);
  }

  await prismaClient.$transaction(transactions);

  console.log("Done.");
}

main().catch(console.error);
