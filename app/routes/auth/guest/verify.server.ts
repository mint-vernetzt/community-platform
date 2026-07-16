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
  locales: { mail: { subject: string } };
}) {
  const now = new Date();
  const result = await prismaClient.guest.update({
    where: {
      id: options.guestId,
    },
    data: {
      confirmed: true,
      confirmedAt: now,
      confirmationToken: null,
      termsAccepted: true,
      termsAcceptedAt: now,
    },
    select: {
      firstName: true,
      email: true,
      event: {
        select: {
          name: true,
        },
      },
    },
  });

  try {
    const sender = process.env.SYSTEM_MAIL_SENDER;
    const recipient = result.email;
    const subject = options.locales.mail.subject;
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
