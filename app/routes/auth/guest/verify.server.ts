import { captureException } from "@sentry/node";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { generateValidationToken } from "~/utils.server";

export async function verifyConfirmationToken(options: {
  token: string;
  type: string | null;
}) {
  const { token, type } = options;

  let guest;
  if (type === "revoke") {
    guest = await prismaClient.guest.findFirst({
      where: {
        revocationToken: token,
      },
      select: {
        id: true,
        eventId: true,
        confirmationSentAt: true,
      },
    });
  } else {
    guest = await prismaClient.guest.findFirst({
      where: {
        confirmationToken: token,
      },
      select: {
        id: true,
        eventId: true,
        confirmationSentAt: true,
      },
    });
  }

  if (guest === null) {
    return {
      error: { message: "Guest not found", code: "not_found" } as const,
      data: null,
    };
  }

  if (
    type !== "revoke" &&
    guest.confirmationSentAt < new Date(Date.now() - 24 * 60 * 60 * 1000)
  ) {
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
  confirmationRedirect: string;
  locales: { mail: { subject: string } };
}) {
  const { guestId, eventId, locales, confirmationRedirect } = options;

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
  const isOnWaitingList =
    event.participantLimit !== null &&
    event._count.participants >= event.participantLimit;

  const revocationToken = generateValidationToken({
    data: JSON.stringify({
      guestId,
      eventId,
      now: now.getTime(),
    }),
    secret: process.env.GUEST_SECRET,
    salt: process.env.GUEST_SALT,
  });

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
      revocationToken,
      onWaitingList: isOnWaitingList,
    },
    select: {
      firstName: true,
      email: true,
      onWaitingList: true,
      revocationToken: true,
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
    const textTemplatePath = isOnWaitingList
      ? "mail-templates/guests/registration-waiting-list-success-text.hbs"
      : "mail-templates/guests/registration-success-text.hbs";
    const htmlTemplatePath = isOnWaitingList
      ? "mail-templates/guests/registration-waiting-list-success-html.hbs"
      : "mail-templates/guests/registration-success-html.hbs";

    // Use plain URL without parameters
    const confirmationRedirectUrl = new URL(confirmationRedirect);
    const confirmationRedirectWithoutParams = `${confirmationRedirectUrl.origin}${confirmationRedirectUrl.pathname}`;

    const data = {
      firstName: result.firstName,
      eventName: result.event.name,
      buttonUrl: `${process.env.COMMUNITY_BASE_URL}/auth/guest/confirm?type=revoke&confirmation_link=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/auth/guest/verify?type=revoke&token_hash=${result.revocationToken}&confirmation_redirect=${encodeURIComponent(confirmationRedirectWithoutParams)}`)}`,
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

export async function revokeGuest(options: {
  guestId: string;
  eventId: string;
  locales: { mail: { subject: string } };
}) {
  const { guestId, eventId, locales } = options;

  const result = await prismaClient.guest.delete({
    where: {
      id: guestId,
      eventId: eventId,
    },
    select: {
      firstName: true,
      email: true,
      event: {
        select: {
          name: true,
        },
      },
      onWaitingList: true,
    },
  });

  try {
    const sender = process.env.SYSTEM_MAIL_SENDER;
    const recipient = result.email;
    const subject = locales.mail.subject;
    const textTemplatePath =
      "mail-templates/general-notification/remove-participant-from-event-text.hbs";
    const htmlTemplatePath =
      "mail-templates/general-notification/remove-participant-from-event-html.hbs";

    const data = {
      firstName: result.firstName,
      event: { name: result.event.name },
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
