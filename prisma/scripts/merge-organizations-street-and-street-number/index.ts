import { prismaClient } from "~/prisma.server";

async function main() {
  const organizations = await prismaClient.organization.findMany();
  console.log(`Found ${organizations.length} organizations.`);

  let updatedCount = 0;

  for (const organization of organizations) {
    if (organization.street !== null && organization.streetNumber !== null) {
      updatedCount = updatedCount + 1;
      await prismaClient.organization.update({
        where: { id: organization.id },
        data: {
          street: `${organization.street} ${organization.streetNumber}`,
          streetNumber: null,
        },
      });
    }
  }

  console.log(`Updated ${updatedCount} organizations.`);
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("Done.");
  });
