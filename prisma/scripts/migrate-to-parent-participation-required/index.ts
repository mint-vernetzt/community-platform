import { prismaClient } from "~/prisma.server";

async function main() {
  const updatedEvents = await prismaClient.event.updateMany({
    where: {
      childEvents: {
        some: {},
      },
      parentParticipationRequired: null,
    },
    data: {
      parentParticipationRequired: true,
    },
  });
  console.log(
    `Updated ${updatedEvents.count} events to have parentParticipationRequired set to true`
  );

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
  if (allParticipantsOnChildEvents.length === 0) {
    console.log(
      "No participants on child events, skipping participation migration"
    );
  } else {
    console.log(
      `There are ${allParticipantsOnChildEvents.length} participants on child events, migrating participation to parent events`
    );
  }

  for (const entry of allParticipantsOnChildEvents) {
    if (entry.event.parentEventId === null) {
      continue;
    }
    await recursivelyAddParticipantsToParentEvent(
      entry.event.parentEventId,
      entry.profileId
    );
  }

  const updatedChildEvents = await prismaClient.event.updateMany({
    where: {
      published: true,
      parentEvent: {
        published: false,
      },
      parentParticipationRequired: null,
    },
    data: {
      parentParticipationRequired: false,
    },
  });

  console.log(
    `Updated ${updatedChildEvents.count} published child events with unpublished parent events to have parentParticipationRequired set to false`
  );
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
