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
      _count: {
        select: {
          participants: true,
          waitingList: true,
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
    try {
      const updatedEvent = await prismaClient.event.findUnique({
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
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
      if (updatedEvent === null) {
        throw new Error("Event not found after update");
      }
      const participantsOffset =
        updatedEvent.participantLimit !== null
          ? updatedEvent.participantLimit - updatedEvent._count.participants
          : updatedEvent._count.waitingList;

      if (participantsOffset > 0) {
        const profilesToMoveUp = updatedEvent.waitingList
          .slice(0, participantsOffset)
          .map((relation) => {
            return { ...relation.profile };
          });
        await prismaClient.$transaction([
          ...profilesToMoveUp.map((profile) => {
            return prismaClient.participantOfEvent.create({
              data: {
                eventId,
                profileId: profile.id,
              },
            });
          }),
          ...profilesToMoveUp.map((profile) => {
            return prismaClient.waitingParticipantOfEvent.delete({
              where: {
                profileId_eventId: {
                  eventId,
                  profileId: profile.id,
                },
              },
            });
          }),
        ]);

        const sender = process.env.SYSTEM_MAIL_SENDER;
        const subject = options.locales.mail.moveUpToParticipants.subject;
        const textTemplatePath =
          "mail-templates/general-notification/move-from-waiting-list-to-participants-of-event-text.hbs";
        const htmlTemplatePath =
          "mail-templates/general-notification/move-from-waiting-list-to-participants-of-event-html.hbs";

        void Promise.all(
          profilesToMoveUp.map(async (profile) => {
            const recipient = profile.email;
            const text = getCompiledMailTemplate<typeof textTemplatePath>(
              textTemplatePath,
              {
                firstName: profile.firstName,
                event: { name: updatedEvent.name },
              },
              "text"
            );
            const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
              htmlTemplatePath,
              {
                firstName: profile.firstName,
                event: { name: updatedEvent.name },
              },
              "html"
            );
            await mailer(mailerOptions, sender, recipient, subject, text, html);
          })
        );
      }
    } catch (error) {
      captureException(error);
    }
  }

  return updatedEvent;
}
