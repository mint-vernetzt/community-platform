import { prismaClient } from "~/prisma.server";
import { getCoordinatesFromAddress } from "~/utils.server";

async function main() {
  const updateQueries = [];

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      city: true,
      street: true,
      zipCode: true,
      latitude: true,
      longitude: true,
    },
  });

  for (const organization of organizations) {
    // Skip existing coordinates
    if (organization.latitude !== null && organization.longitude !== null) {
      console.log(
        `Skipping organization ${organization.id} as it already has coordinates.`
      );
      continue;
    }

    const { longitude, latitude, error } = await getCoordinatesFromAddress({
      id: organization.id,
      street: organization.street,
      city: organization.city,
      zipCode: organization.zipCode,
    });
    if (error !== null) {
      console.error(error);
      continue;
    }

    updateQueries.push(
      prismaClient.organization.update({
        where: { id: organization.id },
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
