import { captureException } from "@sentry/node";
import { prismaClient } from "./prisma.server";
import { getCompiledMailTemplate } from "./mailer.server";
import { insertParametersIntoLocale } from "./lib/utils/i18n";
import { scheduleMail } from "./mailer-queue.server";
import { getVenueString } from "./utils.shared";
import { utcToZonedTime } from "date-fns-tz";
import { getDuration } from "./lib/utils/time";
import { PARTICIPATION_TOKEN_HASH_SEARCH_PARAM } from "./events.shared";

export type ParticipantIdentifier =
  { type: "user"; profileId: string } | { type: "guest"; email: string };

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

function willBeRemovedFromEvent(options: {
  identifier: ParticipantIdentifier;
  event: {
    participants: { profileId: string }[];
    waitingList: { profileId: string }[];
    guests: { email: string; onWaitingList: boolean }[];
  };
}) {
  return (
    isParticipantOnEvent(options) === true ||
    isOnWaitingListOnEvent(options) === true
  );
}

export async function getChildEventsRemovalCascadesInto(options: {
  eventId: string;
}) {
  const { eventId } = options;

  const event = await prismaClient.event.findFirst({
    where: {
      id: eventId,
    },
    select: {
      // Include child events where parent participation is required
      childEvents: {
        where: {
          OR: [
            { parentParticipationRequired: null },
            { parentParticipationRequired: true },
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
            where: {
              confirmed: true,
            },
          },
          // For legacy reasons we need to check child events of child events
          childEvents: {
            where: {
              OR: [
                { parentParticipationRequired: null },
                { parentParticipationRequired: true },
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
                where: {
                  confirmed: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (event === null) {
    return [];
  }

  return event.childEvents;
}

export function getEventsParticipantWillBeRemovedFrom(options: {
  identifier: ParticipantIdentifier;
  childEvents: Awaited<ReturnType<typeof getChildEventsRemovalCascadesInto>>;
}) {
  const { identifier, childEvents } = options;

  const events: { id: string; name: string }[] = [];
  for (const childEvent of childEvents) {
    if (willBeRemovedFromEvent({ identifier, event: childEvent }) === false) {
      continue;
    }
    events.push({ id: childEvent.id, name: childEvent.name });

    for (const grandChildEvent of childEvent.childEvents) {
      if (willBeRemovedFromEvent({ identifier, event: grandChildEvent })) {
        events.push({ id: grandChildEvent.id, name: grandChildEvent.name });
      }
    }
  }

  return events;
}

export async function removeParticipantFromEvent(options: {
  id: string;
  eventId: string;
  type: "user" | "guest";
  recursively?: boolean;
  locales: {
    moveFromWaitingListToParticipants: {
      subject: { de: string; en: string };
    };
    removeFromParticipants: {
      subject: { de: string; en: string };
    };
    removeFromWaitingList: {
      subject: { de: string; en: string };
    };
  };
}) {
  const { id, eventId, type, locales, recursively = true } = options;

  let identifier: ParticipantIdentifier;
  let guest: { firstName: string; email: string } | null = null;
  let user: { firstName: string; email: string } | null = null;
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
    user = await prismaClient.profile.findUnique({
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
      slug: true,
      name: true,
      startTime: true,
      endTime: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      venueCity: true,
      conferenceLink: true,
      conferenceCode: true,
      parentParticipationRequired: true,
      participationToken: true,
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
          slug: true,
          name: true,
          startTime: true,
          endTime: true,
          venueName: true,
          venueStreet: true,
          venueStreetNumber: true,
          venueZipCode: true,
          venueCity: true,
          conferenceLink: true,
          conferenceCode: true,
          participationToken: true,
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
              slug: true,
              participationToken: true,
              name: true,
              startTime: true,
              endTime: true,
              venueName: true,
              venueStreet: true,
              venueStreetNumber: true,
              venueZipCode: true,
              venueCity: true,
              conferenceLink: true,
              conferenceCode: true,
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
  const eventsParticipantHasBeenRemovedFrom = [
    {
      id: eventId,
      participationType: type,
      slug: event.slug,
      name: event.name,
      startTime: event.startTime,
      endTime: event.endTime,
      venueName: event.venueName,
      venueStreet: event.venueStreet,
      venueStreetNumber: event.venueStreetNumber,
      venueZipCode: event.venueZipCode,
      venueCity: event.venueCity,
      conferenceLink: event.conferenceLink,
      conferenceCode: event.conferenceCode,
      removedFromWaitingList: false,
      participationToken: event.participationToken,
    },
  ];

  // First remove the participant from the event
  const transactions = [
    getRemoveFromParticipantsTransaction({ identifier, eventId }),
  ];

  let childEvents: {
    id: string;
    slug: string;
    name: string;
    startTime: Date;
    endTime: Date;
    venueName: string | null;
    venueStreet: string | null;
    venueStreetNumber: string | null;
    venueZipCode: string | null;
    venueCity: string | null;
    conferenceLink: string | null;
    conferenceCode: string | null;
    participationToken: string | null;
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
    if (isParticipant === false && isOnWaitingList === false) {
      continue;
    }
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
    }
    eventsParticipantHasBeenRemovedFrom.push({
      ...childEvent,
      participationType: type,
      removedFromWaitingList: isOnWaitingList,
    });
  }

  // Execute all remove transactions
  try {
    await prismaClient.$transaction(transactions);
    // Send emails to guest or user if they have been removed from any event
    void Promise.all(
      eventsParticipantHasBeenRemovedFrom.map(async (event) => {
        try {
          let recipient;
          let firstName;

          if (type === "guest") {
            if (guest === null) {
              // This should never happen, but makes TypeScript happy
              return;
            }
            recipient = guest.email;
            firstName = guest.firstName;
          } else {
            if (user === null) {
              // This should never happen, but makes TypeScript happy
              return;
            }
            recipient = user.email;
            firstName = user.firstName;
          }
          const textTemplatePath =
            "mail-templates/event/profile-or-guest-removed-from-participants-or-waiting-list-text.hbs";
          const htmlTemplatePath =
            "mail-templates/event/profile-or-guest-removed-from-participants-or-waiting-list-html.hbs";

          const content = {
            headline: {
              de: insertParametersIntoLocale(
                event.removedFromWaitingList
                  ? locales.removeFromWaitingList.subject.de
                  : locales.removeFromParticipants.subject.de,
                { eventName: event.name }
              ),
              en: insertParametersIntoLocale(
                event.removedFromWaitingList
                  ? locales.removeFromWaitingList.subject.en
                  : locales.removeFromParticipants.subject.en,
                { eventName: event.name }
              ),
            },
            profile: {
              firstName,
              isOnWaitingList: event.removedFromWaitingList,
            },
            event: {
              name: event.name,
              url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/detail/about`,
            },
          };

          const text = getCompiledMailTemplate<typeof textTemplatePath>(
            textTemplatePath,
            content,
            "text"
          );
          const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
            htmlTemplatePath,
            content,
            "html"
          );

          const subject = `${content.headline.de} | ${content.headline.en}`;

          await scheduleMail({
            recipient,
            subject,
            plainText: text,
            html,
            eventId: event.id,
          });
        } catch (error) {
          captureException(error);
        }
      })
    );
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
              id: event.id,
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
                    eventId: event.id,
                  },
                },
              });
              const result = await prisma.participantOfEvent.create({
                data: {
                  profileId: nextOnWaitingList.id,
                  eventId: event.id,
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
              return { ...result.profile, type: "user" as const };
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
                revocationToken: true,
              },
            });
            return { ...result, type: "guest" as const };
          }
          return null;
        });

        if (result === null) {
          return;
        }
        const recipient = result.email;

        const zonedStartTime = utcToZonedTime(event.startTime, "Europe/Berlin");
        const zonedEndTime = utcToZonedTime(event.endTime, "Europe/Berlin");

        const date = {
          de: getDuration(zonedStartTime, zonedEndTime, "de"),
          en: getDuration(zonedStartTime, zonedEndTime, "en"),
        };

        const content = {
          headline: {
            de: insertParametersIntoLocale(
              options.locales.moveFromWaitingListToParticipants.subject.de,
              {
                eventName: event.name,
              }
            ),
            en: insertParametersIntoLocale(
              options.locales.moveFromWaitingListToParticipants.subject.en,
              {
                eventName: event.name,
              }
            ),
          },
          profile: {
            firstName: result.firstName,
            isGuest: result.type === "guest",
            isOnWaitingList: false,
          },
          event: {
            name: event.name,
            url: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/detail/about${result.type === "guest" ? `?${PARTICIPATION_TOKEN_HASH_SEARCH_PARAM}=${event.participationToken}` : ""}`,
            date,
            location: getVenueString(event),
            conferenceLink: event.conferenceLink,
            conferenceCode: event.conferenceCode,
            icsLink: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/ics-download`,
            revocationLink: null as string | null,
          },
        };

        if (result.type === "guest") {
          const revocationLink = `${process.env.COMMUNITY_BASE_URL}/auth/guest/confirm?type=revoke&confirmation_link=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/auth/guest/verify?type=revoke&token_hash=${result.revocationToken}&confirmation_redirect=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/detail/about`)}`)}`;
          content.event.revocationLink = revocationLink;
        }

        const textTemplatePath =
          "mail-templates/event/profile-or-guest-moved-up-to-participants-text.hbs";
        const htmlTemplatePath =
          "mail-templates/event/profile-or-guest-moved-up-to-participants-html.hbs";

        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          content,
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          content,
          "html"
        );

        const subject = `${content.headline.de} | ${content.headline.en}`;

        await scheduleMail({
          eventId: event.id,
          recipient,
          subject,
          plainText: text,
          html,
        });
      } catch (error) {
        captureException(error);
      }
    })
  );
  return {};
}
