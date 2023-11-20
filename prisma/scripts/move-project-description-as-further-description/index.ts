import { prismaClient } from "~/prisma.server";

async function main() {
  const projects = await prismaClient.project.findMany({
    where: {
      description: {
        not: null,
      },
      furtherDescription: null,
    },
    select: {
      id: true,
      description: true,
    },
  });

  if (projects.length === 0) {
    console.log("No projects found without further description.");
    return;
  }

  for (const project of projects) {
    await prismaClient.project.update({
      where: {
        id: project.id,
      },
      data: {
        furtherDescription: project.description,
      },
    });
  }

  console.log(`Updated ${projects.length} projects.`);
}

main()
  .catch(console.error)
  .finally(() => {
    prismaClient.$disconnect();
    console.log("Done.");
  });
