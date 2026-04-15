import { prismaClient } from "~/prisma.server";
import { getCoordinatesFromAddress, wait } from "~/utils.server";

async function main() {
  const updateQueries = [];

  const projects = await prismaClient.project.findMany({
    select: {
      id: true,
      city: true,
      street: true,
      zipCode: true,
      latitude: true,
      longitude: true,
    },
  });

  for (const project of projects) {
    await wait(1500); // Wait for 1.5 seconds to avoid hitting rate limits
    const { longitude, latitude, error } = await getCoordinatesFromAddress({
      id: project.id,
      street: project.street,
      city: project.city,
      zipCode: project.zipCode,
    });
    if (error !== null) {
      console.error(error);
      continue;
    }

    updateQueries.push(
      prismaClient.project.update({
        where: { id: project.id },
        data: {
          latitude,
          longitude,
        },
      })
    );
  }
  await prismaClient.$transaction(updateQueries);
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
