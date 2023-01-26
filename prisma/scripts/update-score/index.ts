import { prismaClient } from "~/prisma";
import { getScoreOfEntity } from "./utils";

async function main() {
  let transactions = [];

  const profiles = await prismaClient.profile.findMany();

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

  const organizations = await prismaClient.organization.findMany();

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
