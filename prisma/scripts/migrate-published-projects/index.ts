import { prismaClient } from "~/prisma.server";

async function main() {
  const projects = await prismaClient.project.findMany({
    where: { published: { not: true } },
  });
  const projectsCount = await prismaClient.project.count();
  console.log(
    `Found ${projects.length} of ${projectsCount} projects with no published flag set.`
  );
  for (const project of projects) {
    await prismaClient.project.update({
      where: { id: project.id },
      data: { published: true },
    });
  }
  console.log(`Updated ${projects.length} projects`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("done.");
  });
