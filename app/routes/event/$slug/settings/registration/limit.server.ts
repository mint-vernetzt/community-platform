import { captureException } from "@sentry/node";
import { utcToZonedTime } from "date-fns-tz";
import { PARTICIPATION_TOKEN_HASH_SEARCH_PARAM } from "~/events.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { getDuration } from "~/lib/utils/time";
import { scheduleMail } from "~/mailer-queue.server";
import { getCompiledMailTemplate } from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { getVenueString } from "~/utils.shared";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      participantLimit: true,
      moveUpToParticipants: true,
      external: true,
      openForRegistration: true,
      parentParticipationRequired: true,
      guests: {
        where: {
          confirmed: true,
          onWaitingList: false,
        },
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          participants: true,
          waitingList: true,
          guests: {
            where: {
              confirmed: true,
              onWaitingList: true,
            },
          },
          childEvents: true,
        },
      },
    },
  });
  return event;
}

export async function getEventIdBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
    },
  });
  if (event === null) {
    return null;
  }
  return event.id;
}

export async function updateEventById(options: {
  eventId: string;
  data: { participantLimit?: number | null; moveUpToParticipants?: boolean };
  moveUpToParticipantsAutomatically?: boolean;
  locales: {
    mail: {
      moveUpToParticipants: {
        subject: {
          de: string;
          en: string;
        };
      };
    };
  };
}) {
  const { eventId, data, moveUpToParticipantsAutomatically, locales } = options;

  const updatedEvent = await prismaClient.event.update({
    where: { id: eventId },
    data,
  });

  if (moveUpToParticipantsAutomatically) {
    const event = await prismaClient.event.findUnique({
      where: { id: eventId },
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
        participantLimit: true,
        participationToken: true,
        _count: {
          select: {
            participants: true,
            guests: {
              where: {
                confirmed: true,
                onWaitingList: false,
              },
            },
            waitingList: true,
          },
        },
        waitingList: {
          select: {
            profile: {
              select: {
                id: true,
                email: true,
                firstName: true,
              },
            },
            createdAt: true,
          },
        },
        guests: {
          where: {
            confirmed: true,
            onWaitingList: true,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            confirmedAt: true,
            revocationToken: true,
          },
        },
      },
    });
    if (event === null) {
      throw new Error("Event not found after update");
    }
    const participantsOffset =
      event.participantLimit !== null
        ? event.participantLimit -
          event._count.participants -
          event._count.guests
        : event._count.waitingList + event.guests.length;

    if (participantsOffset > 0) {
      const profilesToMoveUp = [
        ...event.waitingList.map((relation) => {
          return {
            ...relation.profile,
            createdAt: relation.createdAt,
            type: "user" as const,
          };
        }),
        ...event.guests.map((guest) => {
          // This should not happen, because we only select guests that are confirmed
          let createdAt = guest.confirmedAt;
          if (createdAt === null) {
            createdAt = new Date();
          }
          return { ...guest, createdAt, type: "guest" as const };
        }),
      ]
        .sort((a, b) => {
          return a.createdAt.getTime() - b.createdAt.getTime();
        })
        .slice(0, participantsOffset);

      const transactions = [];

      for (const profile of profilesToMoveUp) {
        if (profile.type === "user") {
          transactions.push(
            prismaClient.participantOfEvent.upsert({
              where: {
                profileId_eventId: {
                  eventId,
                  profileId: profile.id,
                },
              },
              update: {},
              create: {
                eventId,
                profileId: profile.id,
              },
            })
          );
          transactions.push(
            prismaClient.waitingParticipantOfEvent.delete({
              where: {
                profileId_eventId: {
                  eventId,
                  profileId: profile.id,
                },
              },
            })
          );
        } else if (profile.type === "guest") {
          transactions.push(
            prismaClient.guest.update({
              where: {
                id: profile.id,
                eventId,
              },
              data: {
                onWaitingList: false,
              },
            })
          );
        }
      }
      await prismaClient.$transaction(transactions);

      const zonedStartTime = utcToZonedTime(event.startTime, "Europe/Berlin");
      const zonedEndTime = utcToZonedTime(event.endTime, "Europe/Berlin");

      const date = {
        de: getDuration(zonedStartTime, zonedEndTime, "de"),
        en: getDuration(zonedStartTime, zonedEndTime, "en"),
      };

      const textTemplatePath =
        "mail-templates/event/profile-or-guest-moved-up-to-participants-text.hbs";
      const htmlTemplatePath =
        "mail-templates/event/profile-or-guest-moved-up-to-participants-html.hbs";

      const location = getVenueString(event);

      void Promise.all(
        profilesToMoveUp.map(async (profile) => {
          const url = `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/detail/about${profile.type === "guest" ? `?${PARTICIPATION_TOKEN_HASH_SEARCH_PARAM}=${event.participationToken}` : ""}`;
          try {
            const content = {
              headline: {
                de: insertParametersIntoLocale(
                  locales.mail.moveUpToParticipants.subject.de,
                  {
                    eventName: event.name,
                  }
                ),
                en: insertParametersIntoLocale(
                  locales.mail.moveUpToParticipants.subject.en,
                  {
                    eventName: event.name,
                  }
                ),
              },
              profile: {
                firstName: profile.firstName,
                isGuest: profile.type === "guest",
              },
              event: {
                name: event.name,
                url,
                date,
                location,
                conferenceLink: event.conferenceLink,
                conferenceCode: event.conferenceCode,
                icsLink: `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/ics-download`,
                revocationLink: null as string | null,
              },
            };

            if (profile.type === "guest") {
              const revocationLink = `${process.env.COMMUNITY_BASE_URL}/auth/guest/confirm?type=revoke&confirmation_link=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/auth/guest/verify?type=revoke&token_hash=${profile.revocationToken}&confirmation_redirect=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/detail`)}`)}`;
              content.event.revocationLink = revocationLink;
            }

            const recipient = profile.email;
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
              eventId,
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
    }
  }

  return updatedEvent;
}
