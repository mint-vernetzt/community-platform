import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { Stages } from "./settings/location.shared";
import { generateValidationToken } from "~/utils.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      published: true,
      publishIntended: true,
      parentEventId: true,
      openForRegistration: true,
      externalRegistrationUrl: true,
      startTime: true,
      external: true,
      participationToken: true,
      parentParticipationRequired: true,
      parentEvent: {
        select: {
          parentParticipationRequired: true,
          published: true,
        },
      },
      _count: {
        select: {
          admins: true,
          teamMembers: true,
          speakers: true,
          participants: true,
          responsibleOrganizations: true,
          documents: true,
          childEvents: true,
          waitingList: true,
        },
      },
    },
  });

  const participatingGuestsCount = await prismaClient.guest.count({
    where: {
      event: {
        slug,
      },
      onWaitingList: false,
    },
  });
  const guestWaitingListCount = await prismaClient.guest.count({
    where: {
      event: {
        slug,
      },
      onWaitingList: true,
    },
  });

  if (event === null) {
    return null;
  }

  event._count.participants =
    event._count.participants + participatingGuestsCount;
  event._count.waitingList = event._count.waitingList + guestWaitingListCount;

  return event;
}

export async function updateEventOnFirstPublish(eventId: string) {
  const result = await prismaClient.event.update({
    where: { id: eventId },
    data: {
      publishIntended: true,
    },
  });
  return result;
}

export async function publishEvent(event: {
  id: string;
  parentEventId: string | null;
  parentEvent: { parentParticipationRequired: boolean | null } | null;
  parentParticipationRequired: boolean | null;
  participationToken: string | null;
}) {
  const transactions = [];

  let token = event.participationToken;

  const hasNoParentEvent = event.parentEventId === null;
  const parentEventDoesNotRequireParticipation =
    event.parentEvent !== null &&
    event.parentEvent.parentParticipationRequired === false;
  const canParticipateDirectly = event.parentParticipationRequired === false;
  if (
    token === null &&
    (hasNoParentEvent ||
      parentEventDoesNotRequireParticipation ||
      canParticipateDirectly)
  ) {
    token = generateValidationToken({
      data: JSON.stringify({ eventId: event.id, now: Date.now() }),
      secret: process.env.PARTICIPATION_SECRET,
      salt: process.env.PARTICIPATION_SALT,
    });
  }
  transactions.push(
    prismaClient.event.update({
      where: { id: event.id },
      data: {
        published: true,
        participationToken: token,
      },
    })
  );
  transactions.push(
    prismaClient.requestToParentEventToAddChildEvent.updateMany({
      where: { childEvent: { id: event.id }, status: "pending" },
      data: { status: "canceled" },
    })
  );

  const [updatedEvent] = await prismaClient.$transaction(transactions);
  return updatedEvent;
}

export async function isAdminOfEvent(sessionUser: User | null, slug: string) {
  if (sessionUser === null) {
    return false;
  }

  const event = await prismaClient.event.findFirst({
    where: {
      slug,
      admins: {
        some: {
          profileId: sessionUser.id,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return event !== null;
}

export async function getRedirectPathOnProtectedEventRoute(options: {
  request: Request;
  slug: string;
  sessionUser: User | null;
  authClient?: SupabaseClient;
}) {
  const { request, slug, sessionUser } = options;
  // redirect to login if not logged in
  if (sessionUser === null) {
    // redirect to target after login
    // TODO: Maybe rename login_redirect to redirect_to everywhere?
    const url = new URL(request.url);
    return `/login?login_redirect=${url.pathname}`;
  }

  // check if admin of event and redirect to event details if not
  const isAdmin = await isAdminOfEvent(sessionUser, slug);
  if (isAdmin === false) {
    return `/event/${slug}/detail/about`;
  }

  return null;
}

export async function getEventBySlugForIssues(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      publishIntended: true,
      external: true,
      externalRegistrationUrl: true,
      description: true,
      subline: true,
      backgroundImageMetaData: true,
      venueStreet: true,
      venueCity: true,
      venueStreetNumber: true,
      venueZipCode: true,
      conferenceLink: true,
      stage: true,
      _count: {
        select: {
          tags: true,
          eventTargetGroups: true,
          focuses: true,
        },
      },
    },
  });

  return event;
}

export function getIssues(options: {
  event: Awaited<ReturnType<typeof getEventBySlugForIssues>>;
  section?: string;
  locales: {
    issues: {
      registration: {
        missingExternalRegistrationUrl: string;
      };
      details: {
        missingDescriptionAndSubline: string;
        missingKeywordsAndTags: string;
        missingBackgroundImage: string;
      };
      location: {
        missingAddress: string;
        missingConferenceLink: string;
        missingAddressAndConferenceLink: string;
      };
    };
  };
}) {
  const { event, locales, section } = options;
  if (event === null || event.publishIntended === false) {
    return [];
  }
  const issues: { section: string; fields: string[]; message: string }[] = [];
  if (event.external && event.externalRegistrationUrl === null) {
    issues.push({
      section: "registration",
      fields: ["externalRegistrationUrl"],
      message: locales.issues.registration.missingExternalRegistrationUrl,
    });
  }
  if (event.description === null && event.subline === null) {
    issues.push({
      section: "details",
      fields: ["description", "subline"],
      message: locales.issues.details.missingDescriptionAndSubline,
    });
  }
  if (
    event._count.tags === 0 &&
    event._count.eventTargetGroups === 0 &&
    event._count.focuses === 0
  ) {
    issues.push({
      section: "details",
      fields: ["tags", "eventTargetGroups", "focuses"],
      message: locales.issues.details.missingKeywordsAndTags,
    });
  }
  if (event.backgroundImageMetaData === null) {
    issues.push({
      section: "details",
      fields: ["title"],
      message: locales.issues.details.missingBackgroundImage,
    });
  }
  if (event.stage !== null) {
    if (event.stage.slug === Stages.Online && event.conferenceLink === null) {
      issues.push({
        section: "location",
        fields: ["conferenceLink"],
        message: locales.issues.location.missingConferenceLink,
      });
    }
    if (
      event.stage.slug === Stages.OnSite &&
      event.venueStreet === null &&
      event.venueCity === null &&
      event.venueZipCode === null
    ) {
      issues.push({
        section: "location",
        fields: ["venueStreet", "venueCity", "venueZipCode"],
        message: locales.issues.location.missingAddress,
      });
    }
    if (
      event.stage.slug === Stages.Hybrid &&
      event.conferenceLink === null &&
      event.venueStreetNumber === null &&
      event.venueCity === null &&
      event.venueZipCode === null
    ) {
      issues.push({
        section: "location",
        fields: ["conferenceLink", "venueStreet", "venueCity", "venueZipCode"],
        message: locales.issues.location.missingAddressAndConferenceLink,
      });
    }
  }
  if (typeof section !== "undefined") {
    return issues.filter((issue) => {
      return issue.section === section;
    });
  }
  return issues;
}
