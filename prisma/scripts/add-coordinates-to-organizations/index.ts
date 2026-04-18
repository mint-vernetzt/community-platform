import { prismaClient } from "~/prisma.server";
import { getCoordinatesFromAddress, wait } from "~/utils.server";

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

  for (const [index, organization] of organizations.entries()) {
    console.log(
      `Adding coordinates to organization ${index + 1}/${organizations.length}`
    );
    await wait(1500); // Wait for 1.5 seconds to avoid hitting rate limits
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
