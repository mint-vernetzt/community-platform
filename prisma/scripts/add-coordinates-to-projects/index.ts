import { prismaClient } from "~/prisma.server";
import { getCoordinatesFromAddress } from "~/utils.server";

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
    // Skip existing coordinates
    if (project.latitude !== null && project.longitude !== null) {
      console.log(
        `Skipping project ${project.id} as it already has coordinates.`
      );
      continue;
    }

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
