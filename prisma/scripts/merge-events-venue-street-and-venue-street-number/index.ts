import { prismaClient } from "~/prisma.server";

async function main() {
  const events = await prismaClient.event.findMany();
  console.log(`Found ${events.length} events.`);

  let updatedCount = 0;

  for (const event of events) {
    if (event.venueStreet !== null && event.venueStreetNumber !== null) {
      updatedCount = updatedCount + 1;
      await prismaClient.event.update({
        where: { id: event.id },
        data: {
          venueStreet: `${event.venueStreet} ${event.venueStreetNumber}`,
          venueStreetNumber: null,
        },
      });
    }
  }

  console.log(`Updated ${updatedCount} events.`);
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("Done.");
  });
