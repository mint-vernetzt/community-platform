import { captureException } from "@sentry/node";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { generateValidationToken } from "~/utils.server";

export async function getGuestByConfirmationToken(token: string) {
  const guest = await prismaClient.guest.findFirst({
    where: {
      confirmationToken: token,
    },
    select: {
      email: true,
      event: {
        select: {
          id: true,
        },
      },
    },
  });

  return guest;
}

export async function requestConfirmation(options: {
  email: string;
  eventId: string;
  oldToken: string;
  confirmationRedirect: string;
  locales: { mail: { confirmRegistration: { subject: string } } };
}) {
  const { email, confirmationRedirect, eventId, oldToken } = options;

  const data = JSON.stringify({
    eventId,
    email,
    now: Date.now(),
  });

  const token = generateValidationToken({
    data,
    secret: process.env.GUEST_SECRET,
    salt: process.env.GUEST_SALT,
  });

  const result = await prismaClient.guest.update({
    where: {
      email_eventId: {
        email,
        eventId,
      },
      confirmationToken: oldToken,
    },
    data: {
      confirmationToken: token,
      confirmationSentAt: new Date(),
    },
    select: {
      email: true,
      firstName: true,
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
    const subject = options.locales.mail.confirmRegistration.subject;
    const textTemplatePath =
      "mail-templates/guests/confirm-registration-text.hbs";
    const htmlTemplatePath =
      "mail-templates/guests/confirm-registration-html.hbs";

    const data = {
      firstName: result.firstName,
      eventName: result.event.name,
      buttonUrl: `${process.env.COMMUNITY_BASE_URL}/auth/guest/confirm?confirmation_link=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/auth/guest/verify?token_hash=${token}&confirmation_redirect=${confirmationRedirect}`)}`,
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
