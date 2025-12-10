import { prismaClient } from "~/prisma.server";
import { getCoordinatesFromAddress } from "~/utils.server";

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
    // Skip existing coordinates
    if (event.venueLatitude !== null && event.venueLongitude !== null) {
      console.log(`Skipping event ${event.id} as it already has coordinates.`);
      continue;
    }

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
