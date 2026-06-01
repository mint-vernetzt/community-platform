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
      name: true,
      published: true,
      canceled: true,
      childEvents: {
        select: {
          slug: true,
          name: true,
          startTime: true,
          endTime: true,
          participantLimit: true,
          stage: {
            select: {
              slug: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      },
      _count: {
        select: {
          childEvents: true,
        },
      },
    },
  });
  return event;
}

export async function cancelEventBySlug(options: {
  slug: string;
  cancelChildEvents?: boolean;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { slug, cancelChildEvents } = options;
  const canceledEvent = await prismaClient.event.update({
    where: { slug },
    data: { canceled: true },
    select: {
      name: true,
      teamMembers: {
        select: { profile: { select: { email: true, firstName: true } } },
      },
      waitingList: {
        select: { profile: { select: { email: true, firstName: true } } },
      },
      speakers: {
        select: { profile: { select: { email: true, firstName: true } } },
      },
      participants: {
        select: { profile: { select: { email: true, firstName: true } } },
      },
      admins: {
        select: { profile: { select: { email: true, firstName: true } } },
      },
    },
  });

  const profilesToContact = [
    ...canceledEvent.teamMembers.map((member) => {
      return { ...member.profile, eventName: canceledEvent.name };
    }),
    ...canceledEvent.waitingList.map((member) => {
      return { ...member.profile, eventName: canceledEvent.name };
    }),
    ...canceledEvent.speakers.map((member) => {
      return { ...member.profile, eventName: canceledEvent.name };
    }),
    ...canceledEvent.participants.map((member) => {
      return { ...member.profile, eventName: canceledEvent.name };
    }),
    ...canceledEvent.admins.map((member) => {
      return { ...member.profile, eventName: canceledEvent.name };
    }),
  ];

  if (cancelChildEvents) {
    const childEvents = await prismaClient.event.findMany({
      where: { parentEvent: { slug }, canceled: false },
      select: {
        id: true,
        name: true,
        teamMembers: {
          select: { profile: { select: { email: true, firstName: true } } },
        },
        waitingList: {
          select: { profile: { select: { email: true, firstName: true } } },
        },
        speakers: {
          select: { profile: { select: { email: true, firstName: true } } },
        },
        participants: {
          select: { profile: { select: { email: true, firstName: true } } },
        },
        admins: {
          select: { profile: { select: { email: true, firstName: true } } },
        },
      },
    });
    const childEventIds = childEvents.map((event) => {
      return event.id;
    });
    await prismaClient.event.updateMany({
      where: {
        id: { in: childEventIds },
      },
      data: { canceled: true },
    });
    childEvents.forEach((event) => {
      event.teamMembers.forEach((member) => {
        profilesToContact.push({ ...member.profile, eventName: event.name });
      });
      event.waitingList.forEach((member) => {
        profilesToContact.push({ ...member.profile, eventName: event.name });
      });
      event.speakers.forEach((member) => {
        profilesToContact.push({ ...member.profile, eventName: event.name });
      });
      event.participants.forEach((member) => {
        profilesToContact.push({ ...member.profile, eventName: event.name });
      });
      event.admins.forEach((member) => {
        profilesToContact.push({ ...member.profile, eventName: event.name });
      });
    });
  } else {
    await prismaClient.event.updateMany({
      where: { parentEvent: { slug }, canceled: false },
      data: { parentEventId: null },
    });
  }

  const uniqueProfilesToContact = profilesToContact.filter(
    (profile, index, array) => {
      return (
        index ===
        array.findIndex((item) => {
          return (
            item.email === profile.email &&
            item.firstName === profile.firstName &&
            item.eventName === profile.eventName
          );
        })
      );
    }
  );

  void Promise.all(
    uniqueProfilesToContact.map(async (profile) => {
      try {
        const sender = process.env.SYSTEM_MAIL_SENDER;
        const recipient = profile.email;
        const subject = options.locales.mail.subject;
        const textTemplatePath =
          "mail-templates/general-notification/event-canceled-text.hbs";
        const htmlTemplatePath =
          "mail-templates/general-notification/event-canceled-html.hbs";

        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: profile.firstName,
            event: { name: canceledEvent.name },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: profile.firstName,
            event: { name: canceledEvent.name },
          },
          "html"
        );
        await mailer(mailerOptions, sender, recipient, subject, text, html);
      } catch (error) {
        captureException(error);
      }
    })
  );

  return canceledEvent;
}
