import { captureException } from "@sentry/node";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
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
        subject: string;
      };
    };
  };
}) {
  const { eventId, data, moveUpToParticipantsAutomatically } = options;

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
        venueName: true,
        venueStreet: true,
        venueStreetNumber: true,
        venueZipCode: true,
        venueCity: true,
        conferenceLink: true,
        participantLimit: true,
        _count: {
          select: {
            participants: true,
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
        ? event.participantLimit - event._count.participants
        : event._count.waitingList;

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

      const subject = insertParametersIntoLocale(
        options.locales.mail.moveUpToParticipants.subject,
        {
          eventName: event.name,
        }
      );
      const textTemplatePath =
        "mail-templates/event/profile-or-guest-moved-up-to-participants-text.hbs";
      const htmlTemplatePath =
        "mail-templates/event/profile-or-guest-moved-up-to-participants-html.hbs";

      const url = `${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/detail`;
      const startDate = event.startTime.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const startTime = event.startTime.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const location = getVenueString(event);

      void Promise.all(
        profilesToMoveUp.map(async (profile) => {
          try {
            const content = {
              headline: subject,
              profile: {
                firstName: profile.firstName,
                isGuest: profile.type === "guest",
              },
              event: {
                name: event.name,
                url,
                startDate,
                startTime,
                timezone: "MEZ",
                location,
                conferenceLink: event.conferenceLink,
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
