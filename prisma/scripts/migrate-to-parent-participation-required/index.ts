import { prismaClient } from "~/prisma.server";
import fs from "fs-extra";

import { dirname } from "path";
import { fileURLToPath } from "url";

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
// Get the current directory path
const __dirname = dirname(__filename);

async function main() {
  const now = new Date();

  // Aggregate data to change
  const parentEventsWithoutParentParticipationRequiredSetToTrue =
    await prismaClient.event.findMany({
      where: {
        childEvents: {
          some: {},
        },
        parentParticipationRequired: null, // check that field wasn't set manually
        endTime: {
          gt: now,
        },
      },
      select: {
        id: true,
        parentParticipationRequired: true,
      },
    });

  const allParticipantsOnChildEvents =
    await prismaClient.participantOfEvent.findMany({
      where: {
        event: {
          parentEventId: {
            not: null,
          },
          parentEvent: {
            parentParticipationRequired: null, // check that field wasn't set manually
            endTime: {
              gt: now,
            },
          },
        },
      },
      select: {
        eventId: true,
        profileId: true,
        event: {
          select: {
            parentEventId: true,
          },
        },
      },
    });
  if (allParticipantsOnChildEvents.length === 0) {
    console.log(
      "No participants on child events, skipping participation migration"
    );
  } else {
    console.log(
      `There are ${allParticipantsOnChildEvents.length} participants on child events, migrating participation to parent events`
    );
  }

  const allParticipantsAddedToParentEvents: {
    profileId: string;
    eventId: string;
  }[] = [];

  for (const entry of allParticipantsOnChildEvents) {
    if (entry.event.parentEventId === null) {
      continue;
    }
    await recursivelyCollectParticipantsToBeAddedToParentEvent(
      entry.event.parentEventId,
      entry.profileId,
      allParticipantsAddedToParentEvents
    );
  }

  const currentTimestamp = new Date().toISOString();
  const path = `${__dirname}/affected_entries_${currentTimestamp}.json`;
  console.log(`Saving changes JSON to: ${path}`);
  await fs.writeJSON(
    path,
    {
      parentEventsWithoutParentParticipationRequiredSetToTrue,
      allParticipantsAddedToParentEvents,
    },
    {
      spaces: 4,
      encoding: "utf8",
    }
  );

  const updatedParentEventsWithoutParentParticipationRequiredSetToTrue =
    await prismaClient.event.updateMany({
      where: {
        id: {
          in: parentEventsWithoutParentParticipationRequiredSetToTrue.map(
            (event) => {
              return event.id;
            }
          ),
        },
      },
      data: {
        parentParticipationRequired: true,
      },
    });

  console.log(
    `Updated ${updatedParentEventsWithoutParentParticipationRequiredSetToTrue.count} events to have parentParticipationRequired set to true`
  );

  for (const entry of allParticipantsAddedToParentEvents) {
    await prismaClient.participantOfEvent.upsert({
      where: {
        profileId_eventId: {
          eventId: entry.eventId,
          profileId: entry.profileId,
        },
      },
      update: {},
      create: {
        eventId: entry.eventId,
        profileId: entry.profileId,
      },
    });
  }

  console.log(
    `Added ${allParticipantsAddedToParentEvents.length} participants to parent events`
  );
}

async function recursivelyCollectParticipantsToBeAddedToParentEvent(
  eventId: string,
  profileId: string,
  collection: { profileId: string; eventId: string }[]
) {
  const relation = await prismaClient.participantOfEvent.findFirst({
    where: {
      eventId,
      profileId,
    },
  });
  if (relation !== null) {
    return;
  }

  collection.push({
    profileId,
    eventId,
  });
  const parentEvent = await prismaClient.event.findFirst({
    where: {
      childEvents: {
        some: {
          id: eventId,
        },
      },
    },
  });
  if (parentEvent === null) {
    return;
  }
  await recursivelyCollectParticipantsToBeAddedToParentEvent(
    parentEvent.id,
    profileId,
    collection
  );
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
