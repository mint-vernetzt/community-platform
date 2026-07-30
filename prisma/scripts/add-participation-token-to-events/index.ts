import { prismaClient } from "~/prisma.server";
import { generateValidationToken } from "~/utils.server";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs-extra";

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
// Get the current directory path
const __dirname = dirname(__filename);

async function main() {
  const now = new Date();

  // Get all events that are not canceled, still published and not in past and have no participation token
  const events = await prismaClient.event.findMany({
    where: {
      canceled: false,
      endTime: {
        gte: new Date(),
      },
      participationToken: null,
      published: true,
    },
    select: {
      id: true,
      participationToken: true,
      parentParticipationRequired: true,
      parentEventId: true,
      parentEvent: {
        select: {
          parentParticipationRequired: true,
        },
      },
    },
  });

  process.stdout.write("\n");

  if (events.length === 0) {
    console.log("No events found without participation token.");
    return;
  }
  console.log(`Found ${events.length} events without participation token.`);

  const filteredEvents = events.filter((event) => {
    const hasNoToken = event.participationToken === null;
    const hasNoParentEvent = event.parentEventId === null;
    const parentEventDoesNotRequireParticipation =
      event.parentEvent !== null &&
      event.parentEvent.parentParticipationRequired === false;
    const canParticipateDirectly = event.parentParticipationRequired === false;
    return (
      hasNoToken &&
      (hasNoParentEvent ||
        parentEventDoesNotRequireParticipation ||
        canParticipateDirectly)
    );
  });

  console.log(
    `${filteredEvents.length} events of ${events.length} will be updated.`
  );
  const timestamp = new Date(now).toISOString();
  const path = `${__dirname}/affected_entries_${timestamp}.json`;
  process.stdout.write(`Saving changes to: ${path}.`);

  const affectedEvents = filteredEvents.map((event) => ({
    id: event.id,
  }));

  await fs.writeJSON(
    path,
    {
      affectedEvents,
    },
    {
      spaces: 4,
      encoding: "utf8",
    }
  );

  process.stdout.write(" Done. \n");

  console.log("Updating events with participation token... .");

  for (let i = 0; i < filteredEvents.length; i++) {
    const event = filteredEvents[i];
    if (event.participationToken !== null) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${i + 1}/${filteredEvents.length} done.`);
      continue;
    }

    const token = generateValidationToken({
      data: JSON.stringify({ eventId: event.id, now: Date.now() }),
      secret: process.env.PARTICIPATION_SECRET,
      salt: process.env.PARTICIPATION_SALT,
    });
    await prismaClient.event.update({
      where: { id: event.id },
      data: { participationToken: token },
    });

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${i + 1}/${filteredEvents.length} done.`);
  }

  console.log("\nAll events updated with participation token.");
}

main()
  .catch((error) => {
    console.error("Error during adding participation token to events:", error);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
