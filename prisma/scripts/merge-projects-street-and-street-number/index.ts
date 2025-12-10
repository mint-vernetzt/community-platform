import { prismaClient } from "~/prisma.server";

async function main() {
  const projects = await prismaClient.project.findMany();
  console.log(`Found ${projects.length} projects.`);

  let updatedCount = 0;

  for (const project of projects) {
    if (project.street !== null && project.streetNumber !== null) {
      updatedCount = updatedCount + 1;
      await prismaClient.project.update({
        where: { id: project.id },
        data: {
          street: `${project.street} ${project.streetNumber}${project.streetNumberAddition !== null ? ` ${project.streetNumberAddition}` : ""}`,
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
