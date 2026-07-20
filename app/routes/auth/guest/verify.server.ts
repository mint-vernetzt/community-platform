import { captureException } from "@sentry/node";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { prismaClient } from "~/prisma.server";

export async function verifyConfirmationToken(token: string) {
  const guest = await prismaClient.guest.findFirst({
    where: {
      confirmationToken: token,
    },
    select: {
      id: true,
      eventId: true,
      confirmationSentAt: true,
    },
  });

  if (guest === null) {
    return {
      error: { message: "Guest not found", code: "not_found" } as const,
      data: null,
    };
  }

  if (guest.confirmationSentAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    return {
      error: {
        message: "Confirmation token expired",
        code: "expired",
      } as const,
      data: null,
    };
  }

  return {
    error: null,
    data: guest,
  };
}

export async function confirmGuest(options: {
  guestId: string;
  eventId: string;
  locales: { mail: { subject: string } };
}) {
  const { guestId, eventId, locales } = options;

  const event = await prismaClient.event.findFirst({
    where: {
      id: eventId,
    },
    select: {
      id: true,
      participantLimit: true,
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  if (event === null) {
    throw new Error("Event not found");
  }

  const now = new Date();

  const result = await prismaClient.guest.update({
    where: {
      id: guestId,
    },
    data: {
      confirmed: true,
      confirmedAt: now,
      confirmationToken: null,
      termsAccepted: true,
      termsAcceptedAt: now,
      onWaitingList:
        event.participantLimit !== null &&
        event._count.participants >= event.participantLimit,
    },
    select: {
      firstName: true,
      email: true,
      event: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  try {
    const sender = process.env.SYSTEM_MAIL_SENDER;
    const recipient = result.email;
    const subject = locales.mail.subject;
    const textTemplatePath =
      "mail-templates/guests/registration-success-text.hbs";
    const htmlTemplatePath =
      "mail-templates/guests/registration-success-html.hbs";

    const data = {
      firstName: result.firstName,
      eventName: result.event.name,
      buttonUrl: "", // revokation url
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

  return result;
}
