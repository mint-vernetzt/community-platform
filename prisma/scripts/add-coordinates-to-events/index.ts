import { prismaClient } from "~/prisma.server";
import { getCoordinatesFromAddress, wait } from "~/utils.server";

async function main() {
  const updateQueries = [];

  const events = await prismaClient.event.findMany({
    select: {
      id: true,
      venueCity: true,
      venueStreet: true,
      venueZipCode: true,
      venueLatitude: true,
      venueLongitude: true,
    },
  });

  for (const event of events) {
    await wait(1500); // Wait for 1.5 seconds to avoid hitting rate limits
    const { longitude, latitude, error } = await getCoordinatesFromAddress({
      id: event.id,
      street: event.venueStreet,
      city: event.venueCity,
      zipCode: event.venueZipCode,
    });
    if (error !== null) {
      console.error(error);
      continue;
    }

    updateQueries.push(
      prismaClient.event.update({
        where: { id: event.id },
        data: {
          venueLatitude: latitude,
          venueLongitude: longitude,
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
