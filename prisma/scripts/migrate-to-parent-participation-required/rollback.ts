import fs from "fs-extra";
import { prismaClient } from "~/prisma.server";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { program } from "commander";

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
// Get the current directory path
const __dirname = dirname(__filename);

program.requiredOption(
  "-f, --file <file>",
  "The json file that contains the changes that need to be rolled back."
);

program.parse(process.argv);

const options = program.opts();

const entitiesSchema = z.object({
  parentEventsWithoutParentParticipationRequiredSetToTrue: z.array(
    z.object({
      id: z.string(),
      parentParticipationRequired: z.boolean().nullable(),
    })
  ),
  allParticipantsAddedToParentEvents: z.array(
    z.object({
      profileId: z.string(),
      eventId: z.string(),
    })
  ),
});

async function main() {
  console.log(
    `Reading migration protocol from json file: ${__dirname}/${options.file}`
  );
  const protocol = await fs.readJson(`${__dirname}/${options.file}`, {
    encoding: "utf8",
  });

  let data;
  try {
    data = entitiesSchema.parse(protocol);
  } catch (error) {
    console.error("Failed to parse migration protocol", error);
    process.exit(1);
  }

  // Rollback participants of child events added to parent events
  for (const participant of data.allParticipantsAddedToParentEvents) {
    await prismaClient.participantOfEvent.delete({
      where: {
        profileId_eventId: {
          eventId: participant.eventId,
          profileId: participant.profileId,
        },
      },
    });
    console.log(
      `Rolled back participant with profileId ${participant.profileId} from event with id ${participant.eventId}`
    );
  }

  // Rollback Parent events without parentParticipationRequired set to true
  for (const event of data.parentEventsWithoutParentParticipationRequiredSetToTrue) {
    await prismaClient.event.update({
      where: {
        id: event.id,
      },
      data: {
        parentParticipationRequired: event.parentParticipationRequired,
      },
    });
    console.log(
      `Rolled back parentParticipationRequired for event with id ${event.id} to ${event.parentParticipationRequired}`
    );
  }
}

main()
  .then(async () => {
    await prismaClient.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prismaClient.$disconnect();
    process.exit(1);
  });
