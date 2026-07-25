import { captureException } from "@sentry/node";
import { prismaClient } from "./prisma.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "./mailer.server";

function getRemoveFromParticipantsTransaction(options: {
  id: string;
  eventId: string;
  type: "user" | "guest";
}) {
  const { id, eventId, type } = options;
  if (type === "user") {
    const transaction = prismaClient.participantOfEvent.delete({
      where: {
        profileId_eventId: {
          profileId: id,
          eventId,
        },
      },
    });
    return transaction;
  }

  const transaction = prismaClient.guest.update({
    where: {
      id,
    },
    data: {
      onWaitingList: false,
    },
  });
  return transaction;
}

function getRemoveFromWaitingListTransaction(options: {
  id: string;
  eventId: string;
  type: "user" | "guest";
}) {
  const { id, eventId, type } = options;
  if (type === "user") {
    const transaction = prismaClient.waitingParticipantOfEvent.delete({
      where: {
        profileId_eventId: {
          profileId: id,
          eventId,
        },
      },
    });
    return transaction;
  }

  const transaction = prismaClient.guest.update({
    where: {
      id,
    },
    data: {
      onWaitingList: false,
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
  id: string;
  type: "user" | "guest";
  event: {
    participants: { profileId: string }[];
    guests: { id: string; onWaitingList: boolean }[];
  };
}) {
  const { id, type, event } = options;
  if (type === "user") {
    return event.participants.some((participant) => {
      return participant.profileId === id;
    });
  }
  return event.guests.some((guest) => {
    return guest.id === id;
  });
}

function isOnWaitingListOnEvent(options: {
  id: string;
  type: "user" | "guest";
  event: {
    waitingList: { profileId: string }[];
    guests: { id: string; onWaitingList: boolean }[];
  };
}) {
  const { id, type, event } = options;
  if (type === "user") {
    return event.waitingList.some((waitingListEntry) => {
      return waitingListEntry.profileId === id;
    });
  }
  return event.guests.some((guest) => {
    return guest.id === id && guest.onWaitingList;
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
              OR: [
                {
                  participants: {
                    some: {
                      profileId: id,
                    },
                  },
                },
                {
                  waitingList: {
                    some: {
                      profileId: id,
                    },
                  },
                },
                {
                  guests: {
                    some: {
                      id,
                    },
                  },
                },
              ],
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
            where: {
              confirmed: true,
            },
            select: {
              id: true,
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
                  OR: [
                    {
                      participants: {
                        some: {
                          profileId: id,
                        },
                      },
                    },
                    {
                      waitingList: {
                        some: {
                          profileId: id,
                        },
                      },
                    },
                    {
                      guests: {
                        some: {
                          id,
                        },
                      },
                    },
                  ],
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
                where: {
                  confirmed: true,
                },
                select: {
                  id: true,
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
    getRemoveFromParticipantsTransaction({ id, eventId, type }),
  ];

  let childEvents: {
    id: string;
    name: string;
    participants: {
      profileId: string;
    }[];
    guests: {
      id: string;
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
  if (childEvents.length > 0 && event.parentParticipationRequired) {
    for (const childEvent of childEvents) {
      const isParticipant = isParticipantOnEvent({
        id,
        type,
        event: childEvent,
      });
      const isOnWaitingList = isOnWaitingListOnEvent({
        id,
        type,
        event: childEvent,
      });
      if (isParticipant) {
        transactions.push(
          getRemoveFromParticipantsTransaction({
            id,
            eventId: childEvent.id,
            type,
          })
        );
      } else if (isOnWaitingList) {
        transactions.push(
          getRemoveFromWaitingListTransaction({
            id,
            eventId: childEvent.id,
            type,
          })
        );
      }
      eventsParticipantHasBeenRemovedFrom.push({
        eventId: childEvent.id,
        name: childEvent.name,
        participationType: type,
        removedFromWaitingList: isOnWaitingList,
      });
    }
  }

  // Execute all remove transactions
  try {
    await prismaClient.$transaction(transactions);
  } catch (error) {
    captureException(error);
    return { error };
  }

  // Send emails to guest if they have been removed from any event;
  if (type === "guest") {
    const guest = await prismaClient.guest.findFirst({
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
            if (event.participationType === "user") {
              await prisma.waitingParticipantOfEvent.delete({
                where: {
                  profileId_eventId: {
                    profileId: id,
                    eventId,
                  },
                },
              });
              const result = await prisma.participantOfEvent.create({
                data: {
                  profileId: id,
                  eventId,
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
                id,
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
