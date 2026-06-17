import { prismaClient } from "~/prisma.server";

async function main() {
  // What's about waiting list
  // Same iteration of adding participant to waiting list as Participants, but with exceptions
  // We ignore events that are in the past
  // If the parent event has spots left, add participant automatically instead of putting him on the waiting list
  // In order add a participant from the waiting list, the user must first be added to all n-parent events as participant
  // Problem: What if there are no spots left?

  // Option 1: If the user is not allowed to be on the waiting list (he is not yet participant of the parent event) -> he has to move up in the parent event waiting list
  // & be removed on the current waiting list(recursively)
  // Problem (1): We need to communicate this to the user

  // Option 2: CheckNecessityOfWaitingListMovement script
  // Checks if there are users that are on the waiting list of a child event
  // & are not participants of the parent
  // & can not be added as participant to the parent
  // & are not in the past

  const now = new Date();

  const usersOnChildWaitingList =
    await prismaClient.waitingParticipantOfEvent.findMany({
      where: {
        event: {
          parentEventId: {
            not: null,
          },
          startTime: {
            gte: now,
          },
        },
      },
      select: {
        profileId: true,
        event: {
          select: {
            parentEventId: true,
          },
        },
      },
    });

  if (usersOnChildWaitingList.length === 0) {
    console.log("Moving of waiting list is not necessary");
    return;
  }

  for (const waitingListEntry of usersOnChildWaitingList) {
    if (waitingListEntry.event.parentEventId === null) {
      // Make Typescript happy, but should always be not null due to the query condition
      continue;
    }
    const participantEntry = await prismaClient.participantOfEvent.findFirst({
      where: {
        eventId: waitingListEntry.event.parentEventId,
        profileId: waitingListEntry.profileId,
      },
    });

    const isUserParticipantOfParentEvent = participantEntry !== null;

    if (isUserParticipantOfParentEvent === false) {
      const parentEvent = await prismaClient.event.findFirst({
        where: {
          id: waitingListEntry.event.parentEventId,
        },
      });

      await prismaClient.event.findFirst({
        where: {},
      });

      // Recursively check if the user can participate on parent event -> collect how many (which persons on which event (Unique persons?))

      // can not participate -> collect how many (which persons on which event (Unique persons?))
    } else {
      // Is already participant
      // -> Other script already ensures that you are participant of all consecutive parent events
    }
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
