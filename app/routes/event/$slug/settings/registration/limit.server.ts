import { captureException } from "@sentry/node";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { prismaClient } from "~/prisma.server";

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
        name: true,
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

      console.log({ profilesToMoveUp });

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
        await prismaClient.$transaction(transactions);
      }
      const sender = process.env.SYSTEM_MAIL_SENDER;
      const subject = options.locales.mail.moveUpToParticipants.subject;
      const textTemplatePath =
        "mail-templates/general-notification/move-from-waiting-list-to-participants-of-event-text.hbs";
      const htmlTemplatePath =
        "mail-templates/general-notification/move-from-waiting-list-to-participants-of-event-html.hbs";
      void Promise.all(
        profilesToMoveUp.map(async (profile) => {
          try {
            const recipient = profile.email;
            const text = getCompiledMailTemplate<typeof textTemplatePath>(
              textTemplatePath,
              {
                firstName: profile.firstName,
                event: { name: event.name },
              },
              "text"
            );
            const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
              htmlTemplatePath,
              {
                firstName: profile.firstName,
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
    }
  }

  return updatedEvent;
}
