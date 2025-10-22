import {
  getReporter,
  sendNewReportMailToSupport,
} from "~/abuse-reporting.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      background: true,
      startTime: true,
      endTime: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      venueCity: true,
      participantLimit: true,
      participationFrom: true,
      participationUntil: true,
      published: true,
      canceled: true,
      stage: {
        select: {
          slug: true,
        },
      },
      parentEvent: {
        select: {
          name: true,
          slug: true,
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
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

export async function deriveModeForEvent(
  sessionUser: { id: string } | null,
  eventInfo: {
    id: string;
    beforeParticipationPeriod: boolean;
    afterParticipationPeriod: boolean;
    inPast: boolean;
    participantLimit: number | null;
    participantCount: number;
  }
) {
  if (sessionUser === null) {
    return "anon" as const;
  }

  const adminRelation = await prismaClient.adminOfEvent.findFirst({
    where: {
      profileId: sessionUser.id,
      eventId: eventInfo.id,
    },
  });

  if (adminRelation !== null) {
    return "admin" as const;
  }

  const participantRelation = await prismaClient.participantOfEvent.findFirst({
    where: {
      profileId: sessionUser.id,
      eventId: eventInfo.id,
    },
  });

  if (participantRelation !== null) {
    return "participating" as const;
  }

  const waitingParticipantRelation =
    await prismaClient.waitingParticipantOfEvent.findFirst({
      where: {
        profileId: sessionUser.id,
        eventId: eventInfo.id,
      },
    });

  if (waitingParticipantRelation !== null) {
    return "waiting" as const;
  }

  if (
    eventInfo.inPast ||
    eventInfo.afterParticipationPeriod ||
    eventInfo.beforeParticipationPeriod
  ) {
    return null;
  }

  if (
    eventInfo.participantLimit !== null &&
    eventInfo.participantCount >= eventInfo.participantLimit
  ) {
    return "canWait" as const;
  }

  return "canParticipate" as const;
}

export async function getIsMember(
  sessionUser: { id: string } | null,
  event: { id: string }
) {
  if (sessionUser === null) {
    return false;
  }

  const member = await prismaClient.profile.findFirst({
    where: {
      id: sessionUser.id,
      OR: [
        {
          teamMemberOfEvents: {
            some: {
              eventId: event.id,
            },
          },
          contributedEvents: {
            some: {
              eventId: event.id,
            },
          },
          administeredEvents: {
            some: {
              eventId: event.id,
            },
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });
  return member !== null;
}

export async function addProfileToParticipants(
  profileId: string,
  eventId: string
) {
  try {
    const data = await prismaClient.participantOfEvent.create({
      data: {
        eventId,
        profileId,
      },
    });
    return { data };
  } catch (error) {
    console.error("Error adding profile to participants:", error);
    return { error };
  }
}

export async function removeProfileFromParticipants(
  profileId: string,
  eventId: string
) {
  try {
    const data = await prismaClient.participantOfEvent.deleteMany({
      where: {
        eventId,
        profileId,
      },
    });
    return { data };
  } catch (error) {
    console.error("Error removing profile from participants:", error);
    return { error };
  }
}

export async function addProfileToWaitingList(
  profileId: string,
  eventId: string
) {
  try {
    const data = await prismaClient.waitingParticipantOfEvent.create({
      data: {
        eventId,
        profileId,
      },
    });
    return { data };
  } catch (error) {
    console.error("Error adding profile to waiting list:", error);
    return { error };
  }
}

export async function removeProfileFromWaitingList(
  profileId: string,
  eventId: string
) {
  try {
    const data = await prismaClient.waitingParticipantOfEvent.deleteMany({
      where: {
        eventId,
        profileId,
      },
    });
    return { data };
  } catch (error) {
    console.error("Error removing profile from waiting list:", error);
    return { error };
  }
}

export async function getHasUserReportedEvent(
  sessionUser: { id: string } | null,
  eventId: string
) {
  if (sessionUser === null) {
    return false;
  }
  const report = await prismaClient.eventAbuseReport.findFirst({
    where: {
      eventId,
      status: "open",
      reporterId: sessionUser.id,
    },
    select: {
      id: true,
    },
  });
  return report !== null;
}

export async function getAbuseReportReasons() {
  const reasons = await prismaClient.eventAbuseReportReasonSuggestion.findMany({
    select: {
      slug: true,
      description: true,
    },
  });
  return reasons;
}

export async function reportEvent(options: {
  sessionUser: { id: string };
  event: {
    id: string;
    slug: string;
  };
  reasons: string[];
  otherReason?: string;
  locales: { email: { subject: string } };
}) {
  let report: Awaited<ReturnType<typeof createEventAbuseReport>>;

  try {
    const existingReport = await prismaClient.eventAbuseReport.findFirst({
      where: {
        eventId: options.event.id,
        reporterId: options.sessionUser.id,
        status: "open",
      },
      select: {
        id: true,
      },
    });

    if (existingReport !== null) {
      const error = new Error("Report already exists");
      console.error(error);
      return { error };
    }

    const suggestions =
      await prismaClient.eventAbuseReportReasonSuggestion.findMany({
        where: {
          slug: {
            in: options.reasons,
          },
        },
      });
    const reasonsForReport: string[] = [];
    for (const suggestion of suggestions) {
      reasonsForReport.push(suggestion.description);
    }
    if (typeof options.otherReason === "string") {
      reasonsForReport.push(options.otherReason);
    }

    report = await createEventAbuseReport({
      reporterId: options.sessionUser.id,
      slug: options.event.slug,
      reasons: reasonsForReport,
      locales: options.locales,
    });
    await sendNewReportMailToSupport(report);
  } catch (error) {
    console.error({ error });
    return { error };
  }

  return { data: report };
}

async function createEventAbuseReport(options: {
  reporterId: string;
  slug: string;
  reasons: string[];
  locales: {
    email: { subject: string };
  };
}) {
  const reporter = await getReporter(options.reporterId);
  const title = insertParametersIntoLocale(options.locales.email.subject, {
    username: reporter.username,
    slug: options.slug,
  });

  await prismaClient.event.update({
    data: {
      abuseReports: {
        create: {
          title: title,
          reporterId: options.reporterId,
          reasons: {
            createMany: {
              data: options.reasons.map((reason) => {
                return {
                  description: reason,
                };
              }),
            },
          },
        },
      },
    },
    where: {
      slug: options.slug,
    },
  });
  return {
    title,
    entityUrl: `${process.env.COMMUNITY_BASE_URL}/event/${options.slug}/detail/about`,
    reporter: {
      email: reporter.email,
      url: `${process.env.COMMUNITY_BASE_URL}/profile/${reporter.username}`,
    },
    reasons: options.reasons,
  };
}
