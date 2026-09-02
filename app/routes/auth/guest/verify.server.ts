import { captureException } from "@sentry/node";
import { utcToZonedTime } from "date-fns-tz";
import { removeParticipantFromEvent } from "~/events.server";
import { PARTICIPATION_TOKEN_HASH_SEARCH_PARAM } from "~/events.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { getDuration } from "~/lib/utils/time";
import { scheduleMail } from "~/mailer-queue.server";
import { getCompiledMailTemplate } from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { generateValidationToken } from "~/utils.server";
import { getVenueString } from "~/utils.shared";

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
  locales: {
    mail: {
      addedToWaitingList: { subject: { de: string; en: string } };
      addedToParticipants: { subject: { de: string; en: string } };
    };
  };
}) {
  const { guestId, eventId, locales, confirmationRedirect } = options;

  const event = await prismaClient.event.findFirst({
    where: {
      id: eventId,
    },
    select: {
      id: true,
      participantLimit: true,
      guests: {
        where: {
          onWaitingList: false,
          confirmed: true,
        },
        select: {
          id: true,
        },
      },
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
    event._count.participants + event.guests.length >= event.participantLimit;

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
          slug: true,
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
        },
      },
    },
  });

  try {
    const recipient = result.email;
    // Use plain URL without parameters
    const confirmationRedirectUrl = new URL(confirmationRedirect);
    const confirmationRedirectWithoutParams = `${confirmationRedirectUrl.origin}${confirmationRedirectUrl.pathname}`;

    const revocationLink = `${process.env.COMMUNITY_BASE_URL}/auth/guest/confirm?type=revoke&confirmation_link=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/auth/guest/verify?type=revoke&token_hash=${result.revocationToken}&confirmation_redirect=${encodeURIComponent(confirmationRedirectWithoutParams)}`)}`;

    const subjectSource = isOnWaitingList
      ? locales.mail.addedToWaitingList.subject
      : locales.mail.addedToParticipants.subject;

    const subject = {
      de: insertParametersIntoLocale(subjectSource.de, {
        eventName: result.event.name,
      }),
      en: insertParametersIntoLocale(subjectSource.en, {
        eventName: result.event.name,
      }),
    };

    const zonedStartTime = utcToZonedTime(
      result.event.startTime,
      "Europe/Berlin"
    );
    const zonedEndTime = utcToZonedTime(result.event.endTime, "Europe/Berlin");

    const date = {
      de: getDuration(zonedStartTime, zonedEndTime, "de"),
      en: getDuration(zonedStartTime, zonedEndTime, "en"),
    };

    const content = {
      headline: subject,
      profile: {
        firstName: result.firstName,
        isGuest: true,
        isOnWaitingList: result.onWaitingList,
      },
      event: {
        name: result.event.name,
        url: `${process.env.COMMUNITY_BASE_URL}/event/${result.event.slug}/detail/about${result.onWaitingList === false ? `?${PARTICIPATION_TOKEN_HASH_SEARCH_PARAM}=${result.event.participationToken}` : ""}`, // Add participation token to ensure that guests can participate on sub-events
        date,
        location: getVenueString(result.event),
        icsLink: `${process.env.COMMUNITY_BASE_URL}/event/${result.event.slug}/ics-download`,
        conferenceLink: result.event.conferenceLink,
        conferenceCode: result.event.conferenceCode,
        revocationLink,
      },
    };
    const textTemplatePath =
      "mail-templates/event/profile-or-guest-added-to-participants-or-waiting-list-text.hbs";
    const htmlTemplatePath =
      "mail-templates/event/profile-or-guest-added-to-participants-or-waiting-list-html.hbs";
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
      subject: `${subject.de} | ${subject.en}`,
      plainText: text,
      html,
    });
  } catch (error) {
    captureException(error);
  }

  return result;
}

export async function revokeGuest(options: {
  guestId: string;
  eventId: string;
  locales: {
    mail: {
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
  };
}) {
  const { guestId, eventId, locales } = options;

  const result = await removeParticipantFromEvent({
    id: guestId,
    eventId,
    type: "guest",
    locales: {
      ...locales.mail,
    },
  });

  return result;
}
