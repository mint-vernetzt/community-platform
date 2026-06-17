import { prismaClient } from "~/prisma.server";

async function main() {
  // Default: all events have parentParticipationRequired set to null (Database migration)
  // Update all existing events with child events to have parentParticipationRequired set to true
  const updatedEvents = await prismaClient.event.updateMany({
    where: {
      childEvents: {
        some: {},
      },
    },
    data: {
      parentParticipationRequired: true,
    },
  });
  console.log(
    `Updated ${updatedEvents.count} events to have parentParticipationRequired set to true`
  );
  // Participants on child events should be also participate on parent event
  const allParticipantsOnChildEvents =
    await prismaClient.participantOfEvent.findMany({
      where: {
        event: {
          parentEventId: {
            not: null,
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
  for (const entry of allParticipantsOnChildEvents) {
    if (entry.event.parentEventId === null) {
      // Make Typescript happy, but should always be not null due to the query condition
      continue;
    }
    await recursivelyAddParticipantsToParentEvent(
      entry.event.parentEventId,
      entry.profileId
    );
  }

  // What's about waiting list
  // Enforce that published child events should have published parent event
  // 1. check database if this is a case

  // Attention: Check if n level deep events handled properly
}

async function recursivelyAddParticipantsToParentEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.participantOfEvent.upsert({
    where: {
      profileId_eventId: {
        eventId: eventId,
        profileId,
      },
    },
    update: {},
    create: {
      eventId: eventId,
      profileId,
    },
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
  await recursivelyAddParticipantsToParentEvent(parentEvent.id, profileId);
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
