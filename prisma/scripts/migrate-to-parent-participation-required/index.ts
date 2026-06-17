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
      // Make Typescript happy, but should always be not null due to the query condition
      continue;
    }
    await recursivelyAddParticipantsToParentEvent(
      entry.event.parentEventId,
      entry.profileId
    );
  }

  // What we know: There are no people on the waiting list of a child event that are not participant of the parent event
  // So we can skip handle waiting list entries

  // Enforce that published child events should have published parent event
  // What we know: There are published child events that have unpublished parent events
  // Affected parent: 3a177d10-e379-473b-b46f-cceff07a2e1f "Tech4Kids  Durchgang 2026/2027"
  // Question: Does this affect any functionality?
  // Nope: You can actually participate on child event if parent event is not published (mode == "canParticipate") because parentEvent will be null
  // We handle this case by setting participationRequired to false on published child events with unpublished parent events

  const updatedChildEvents = await prismaClient.event.updateMany({
    where: {
      published: true,
      parentEvent: {
        published: false,
      },
    },
    data: {
      parentParticipationRequired: false,
    },
  });

  console.log(
    `Updated ${updatedChildEvents.count} published child events with unpublished parent events to have parentParticipationRequired set to false`
  );

  // Attention: Check if n level deep events handled properly

  // Test Scenario
  // child event has participants that are not participant of the parent event
  // child event has participants that are not participants of parent and grand parent event
  // published child event has unpublished parent event
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
