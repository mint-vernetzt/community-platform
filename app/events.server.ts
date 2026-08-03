import { captureException } from "@sentry/node";
import { prismaClient } from "./prisma.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "./mailer.server";

type ParticipantIdentifier =
  | { type: "user"; profileId: string }
  | { type: "guest"; email: string };

function getRemoveFromParticipantsTransaction(options: {
  identifier: ParticipantIdentifier;
  eventId: string;
}) {
  const { identifier, eventId } = options;
  if (identifier.type === "user") {
    const transaction = prismaClient.participantOfEvent.delete({
      where: {
        profileId_eventId: {
          profileId: identifier.profileId,
          eventId,
        },
      },
    });
    return transaction;
  }

  const transaction = prismaClient.guest.delete({
    where: {
      email_eventId: {
        email: identifier.email,
        eventId,
      },
    },
  });
  return transaction;
}

function getRemoveFromWaitingListTransaction(options: {
  identifier: ParticipantIdentifier;
  eventId: string;
}) {
  const { identifier, eventId } = options;
  if (identifier.type === "user") {
    const transaction = prismaClient.waitingParticipantOfEvent.delete({
      where: {
        profileId_eventId: {
          profileId: identifier.profileId,
          eventId,
        },
      },
    });
    return transaction;
  }

  // Guests have no separate waiting list table, the registration itself carries
  // the flag - so removing them from the waiting list deletes the registration
  const transaction = prismaClient.guest.delete({
    where: {
      email_eventId: {
        email: identifier.email,
        eventId,
      },
    },
  });
  return transaction;
}

function shouldMoveUpToParticipants(options: {
  moveUpToParticipants: boolean;
  participantLimit: number | null;
  participantCount: number;
  participatingGuestCount: number;
  usersOnWaitingListCount: number;
  guestsOnWaitingListCount: number;
}) {
  const {
    moveUpToParticipants,
    participantLimit,
    participantCount,
    participatingGuestCount,
    usersOnWaitingListCount,
    guestsOnWaitingListCount,
  } = options;

  if (
    moveUpToParticipants === false ||
    participantLimit === null ||
    participantCount + participatingGuestCount >= participantLimit
  ) {
    return false;
  }

  const someoneOnWaitingList =
    usersOnWaitingListCount + guestsOnWaitingListCount > 0;
  return someoneOnWaitingList;
}

function getNextOnWaitingList(options: {
  usersOnWaitingList: { profileId: string; createdAt: Date }[];
  guestsOnWaitingList: { id: string; confirmedAt: Date }[];
}) {
  const { usersOnWaitingList, guestsOnWaitingList } = options;

  if (usersOnWaitingList.length === 0 && guestsOnWaitingList.length === 0) {
    return null;
  }

  const combinedWaitingList = [
    ...usersOnWaitingList.map((user) => ({
      id: user.profileId,
      createdAt: user.createdAt,
      type: "user" as const,
    })),
    ...guestsOnWaitingList.map((guest) => ({
      id: guest.id,
      createdAt: guest.confirmedAt,
      type: "guest" as const,
    })),
  ].sort((a, b) => {
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return combinedWaitingList[0];
}

function isParticipantOnEvent(options: {
  identifier: ParticipantIdentifier;
  event: {
    participants: { profileId: string }[];
    guests: { email: string; onWaitingList: boolean }[];
  };
}) {
  const { identifier, event } = options;
  if (identifier.type === "user") {
    return event.participants.some((participant) => {
      return participant.profileId === identifier.profileId;
    });
  }
  return event.guests.some((guest) => {
    return guest.email === identifier.email && guest.onWaitingList === false;
  });
}

function isOnWaitingListOnEvent(options: {
  identifier: ParticipantIdentifier;
  event: {
    waitingList: { profileId: string }[];
    guests: { email: string; onWaitingList: boolean }[];
  };
}) {
  const { identifier, event } = options;
  if (identifier.type === "user") {
    return event.waitingList.some((waitingListEntry) => {
      return waitingListEntry.profileId === identifier.profileId;
    });
  }
  return event.guests.some((guest) => {
    return guest.email === identifier.email && guest.onWaitingList;
  });
}

export async function removeParticipantFromEvent(options: {
  id: string;
  eventId: string;
  type: "user" | "guest";
  recursively?: boolean;
  notifyUsers?: boolean;
  locales: {
    moveFromWaitingListToParticipants: {
      subject: string;
    };
    removeFromParticipants: {
      subject: string;
    };
    guestRemoved: {
      subject: string;
    };
  };
}) {
  const {
    id,
    eventId,
    type,
    locales,
    recursively = true,
    notifyUsers,
  } = options;

  let identifier: ParticipantIdentifier;
  let guest: { firstName: string; email: string } | null = null;
  if (type === "guest") {
    guest = await prismaClient.guest.findUnique({
      where: {
        id,
      },
      select: {
        firstName: true,
        email: true,
      },
    });
    if (guest === null) {
      const error = new Error("Guest not found");
      return { error };
    }
    identifier = { type: "guest", email: guest.email };
  } else {
    identifier = { type: "user", profileId: id };
  }

  // Participant participates, is on waiting list, or is a guest
  const participationFilter =
    identifier.type === "user"
      ? [
          {
            participants: {
              some: {
                profileId: identifier.profileId,
              },
            },
          },
          {
            waitingList: {
              some: {
                profileId: identifier.profileId,
              },
            },
          },
        ]
      : [
          {
            guests: {
              some: {
                email: identifier.email,
              },
            },
          },
        ];

  const event = await prismaClient.event.findFirst({
    where: {
      id: eventId,
    },
    select: {
      name: true,
      parentParticipationRequired: true,
      childEvents: {
        where: {
          // Include child events where parent participation is required
          // AND
          // participant participates, is on waiting list, or is a guest
          AND: [
            {
              OR: [
                { parentParticipationRequired: null },
                { parentParticipationRequired: true },
              ],
            },
            {
              OR: participationFilter,
            },
          ],
        },
        select: {
          id: true,
          name: true,
          participants: {
            select: {
              profileId: true,
            },
          },
          waitingList: {
            select: {
              profileId: true,
            },
          },
          // Unconfirmed guest registrations are included on purpose - a pending
          // registration on a child event has to be removed as well
          guests: {
            select: {
              email: true,
              onWaitingList: true,
            },
          },
          // For legacy reasons we need to check child events of child events
          childEvents: {
            where: {
              AND: [
                // Include child events where parent participation is required
                // AND
                // participant participates, is on waiting list, or is a guest
                {
                  OR: [
                    { parentParticipationRequired: null },
                    { parentParticipationRequired: true },
                  ],
                },
                {
                  OR: participationFilter,
                },
              ],
            },
            select: {
              id: true,
              name: true,
              participants: {
                select: {
                  profileId: true,
                },
              },
              waitingList: {
                select: {
                  profileId: true,
                },
              },
              guests: {
                select: {
                  email: true,
                  onWaitingList: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (event === null) {
    const error = new Error("Event not found");
    return { error };
  }

  // Collect all events where the participant be removed from
  const eventsParticipantHasBeenRemovedFrom: {
    eventId: string;
    name: string;
    participationType: "user" | "guest";
    removedFromWaitingList: boolean;
  }[] = [
    {
      eventId,
      participationType: type,
      name: event.name,
      removedFromWaitingList: false,
    },
  ];

  // First remove the participant from the event
  const transactions = [
    getRemoveFromParticipantsTransaction({ identifier, eventId }),
  ];

  let childEvents: {
    id: string;
    name: string;
    participants: {
      profileId: string;
    }[];
    guests: {
      email: string;
      onWaitingList: boolean;
    }[];
    waitingList: {
      profileId: string;
    }[];
  }[] = [];

  if (recursively) {
    childEvents = event.childEvents.map((childEvent) => {
      const { childEvents: _childEvents, ...rest } = childEvent;
      return {
        ...rest,
      };
    });
    // For legacy reasons we need to check child events of child events
    for (const childEvent of event.childEvents) {
      if (childEvent.childEvents.length > 0) {
        childEvents.push(...childEvent.childEvents);
      }
    }
  }

  // Iterate over child events and remove the participant from them as well
  for (const childEvent of childEvents) {
    const isParticipant = isParticipantOnEvent({
      identifier,
      event: childEvent,
    });
    const isOnWaitingList = isOnWaitingListOnEvent({
      identifier,
      event: childEvent,
    });
    if (isParticipant) {
      transactions.push(
        getRemoveFromParticipantsTransaction({
          identifier,
          eventId: childEvent.id,
        })
      );
    } else if (isOnWaitingList) {
      transactions.push(
        getRemoveFromWaitingListTransaction({
          identifier,
          eventId: childEvent.id,
        })
      );
    } else {
      continue;
    }
    eventsParticipantHasBeenRemovedFrom.push({
      eventId: childEvent.id,
      name: childEvent.name,
      participationType: type,
      removedFromWaitingList: isOnWaitingList,
    });
  }

  // Execute all remove transactions
  try {
    await prismaClient.$transaction(transactions);
    // Send emails to guest if they have been removed from any event;
    if (type === "guest") {
      void Promise.all(
        eventsParticipantHasBeenRemovedFrom.map(async (event) => {
          try {
            if (guest === null) {
              // This should never happen, but makes TypeScript happy
              return;
            }
            const sender = process.env.SYSTEM_MAIL_SENDER;
            const recipient = guest.email as string;
            const subject = locales.guestRemoved.subject;
            const textTemplatePath =
              "mail-templates/general-notification/remove-participant-from-event-text.hbs";
            const htmlTemplatePath =
              "mail-templates/general-notification/remove-participant-from-event-html.hbs";

            const data = {
              firstName: guest.firstName,
              event: { name: event.name },
            };

            const text = getCompiledMailTemplate<typeof textTemplatePath>(
              textTemplatePath,
              data,
              "text"
            );
            const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
              htmlTemplatePath,
              data,
              "html"
            );

            await mailer(mailerOptions, sender, recipient, subject, text, html);
          } catch (error) {
            captureException(error);
          }
        })
      );
      // Send emails to user if desired
    } else if (type === "user" && notifyUsers) {
      const user = await prismaClient.profile.findFirst({
        where: {
          id,
        },
        select: {
          firstName: true,
          email: true,
        },
      });

      if (user === null) {
        const error = new Error("User not found");
        return { error };
      }

      void Promise.all(
        eventsParticipantHasBeenRemovedFrom.map(async (event) => {
          try {
            const sender = process.env.SYSTEM_MAIL_SENDER;
            const recipient = user.email as string;
            const subject = locales.removeFromParticipants.subject;
            const textTemplatePath =
              "mail-templates/general-notification/remove-participant-from-event-text.hbs";
            const htmlTemplatePath =
              "mail-templates/general-notification/remove-participant-from-event-html.hbs";

            const data = {
              firstName: user.firstName,
              event: { name: event.name },
            };

            const text = getCompiledMailTemplate<typeof textTemplatePath>(
              textTemplatePath,
              data,
              "text"
            );
            const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
              htmlTemplatePath,
              data,
              "html"
            );

            await mailer(mailerOptions, sender, recipient, subject, text, html);
          } catch (error) {
            captureException(error);
          }
        })
      );
    }
  } catch (error) {
    captureException(error);
    return { error };
  }

  // Move the next participant on the waiting list to participants if the event has moveUpToParticipants enabled and there is space available
  void Promise.all(
    eventsParticipantHasBeenRemovedFrom.map(async (event) => {
      try {
        const result = await prismaClient.$transaction(async (prisma) => {
          const eventData = await prisma.event.findFirst({
            where: {
              id: event.eventId,
            },
            select: {
              moveUpToParticipants: true,
              participantLimit: true,
              _count: {
                select: {
                  participants: true,
                },
              },
              waitingList: {
                select: {
                  profileId: true,
                  createdAt: true,
                },
                orderBy: {
                  createdAt: "asc",
                },
                take: 1,
              },
              guests: {
                where: {
                  confirmed: true,
                },
                select: {
                  id: true,
                  onWaitingList: true,
                  confirmedAt: true,
                },
                orderBy: {
                  confirmedAt: "asc",
                },
                take: 1,
              },
            },
          });
          if (eventData === null) {
            return null;
          }

          const participatingGuestCount = eventData.guests.filter((guest) => {
            return guest.onWaitingList === false;
          }).length;
          const guestsOnWaitingListCount =
            eventData.guests.length - participatingGuestCount;

          if (
            shouldMoveUpToParticipants({
              moveUpToParticipants: eventData.moveUpToParticipants,
              participantLimit: eventData.participantLimit,
              participantCount: eventData._count.participants,
              participatingGuestCount,
              usersOnWaitingListCount: eventData.waitingList.length,
              guestsOnWaitingListCount,
            })
          ) {
            const nextOnWaitingList = getNextOnWaitingList({
              usersOnWaitingList: eventData.waitingList,
              guestsOnWaitingList: eventData.guests as {
                id: string;
                confirmedAt: Date;
              }[], // Type assertion because we know that confirmedAt is not null due to the where clause
            });
            if (nextOnWaitingList === null) {
              return null;
            }
            if (nextOnWaitingList.type === "user") {
              await prisma.waitingParticipantOfEvent.delete({
                where: {
                  profileId_eventId: {
                    profileId: nextOnWaitingList.id,
                    eventId: event.eventId,
                  },
                },
              });
              const result = await prisma.participantOfEvent.create({
                data: {
                  profileId: nextOnWaitingList.id,
                  eventId: event.eventId,
                },
                select: {
                  profile: {
                    select: {
                      email: true,
                      firstName: true,
                    },
                  },
                },
              });
              return result.profile;
            }
            const result = await prisma.guest.update({
              where: {
                id: nextOnWaitingList.id,
              },
              data: {
                onWaitingList: false,
              },
              select: {
                email: true,
                firstName: true,
              },
            });
            return result;
          }
          return null;
        });

        if (result === null) {
          return;
        }

        const sender = process.env.SYSTEM_MAIL_SENDER;
        const recipient = result.email;
        const subject =
          options.locales.moveFromWaitingListToParticipants.subject;
        const textTemplatePath =
          "mail-templates/general-notification/move-from-waiting-list-to-participants-of-event-text.hbs";
        const htmlTemplatePath =
          "mail-templates/general-notification/move-from-waiting-list-to-participants-of-event-html.hbs";

        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: result.firstName,
            event: { name: event.name },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: result.firstName,
            event: { name: event.name },
          },
          "html"
        );
        await mailer(mailerOptions, sender, recipient, subject, text, html);
      } catch (error) {
        captureException(error);
      }
    })
  );
  return {};
}
