import { parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { utcToZonedTime } from "date-fns-tz";
import { z } from "zod";
import {
  getReporter,
  sendNewReportMailToSupport,
} from "~/abuse-reporting.server";
import {
  createImageUploadSchema,
  disconnectImageSchema,
} from "~/components/legacy/ImageCropper/ImageCropper";
import { removeParticipantFromEvent } from "~/events.server";
import { PARTICIPATION_TOKEN_HASH_SEARCH_PARAM } from "~/events.shared";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { getDuration } from "~/lib/utils/time";
import { scheduleMail } from "~/mailer-queue.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { filterProfileByVisibility } from "~/public-fields-filtering.server";
import { getPublicURL, uploadFileToStorage } from "~/storage.server";
import { FILE_FIELD_NAME } from "~/storage.shared";
import { generateValidationToken } from "~/utils.server";
import { getVenueString } from "~/utils.shared";
import { PARTICIPATE_ON_EVENT_INTENT_SEARCH_PARAM } from "./details.shared";

export async function getEventBySlug(
  sessionUser: { id: string } | null,
  eventInfo: { slug: string }
) {
  const { slug } = eventInfo;

  let profileId: string | undefined;
  if (sessionUser !== null) {
    profileId = sessionUser.id;
  }

  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      backgroundImageMetaData: {
        select: {
          path: true,
          description: true,
          credits: true,
        },
      },
      startTime: true,
      endTime: true,
      venueName: true,
      venueStreet: true,
      venueZipCode: true,
      venueCity: true,
      participantLimit: true,
      participationFrom: true,
      participationUntil: true,
      published: true,
      canceled: true,
      conferenceLink: true,
      conferenceCode: true,
      external: true,
      externalRegistrationUrl: true,
      openForRegistration: true,
      parentParticipationRequired: true,
      participationToken: true,
      stage: {
        select: {
          slug: true,
        },
      },
      parentEvent: {
        select: {
          name: true,
          slug: true,
          parentParticipationRequired: true,
          participationToken: true,
          external: true,
          participants: {
            select: {
              profileId: true,
            },
          },
        },
        where: {
          OR: [
            { published: true },
            {
              admins: {
                some: {
                  profileId,
                },
              },
            },
            {
              teamMembers: {
                some: {
                  profileId,
                },
              },
            },
            {
              speakers: {
                some: {
                  profileId,
                },
              },
            },
          ],
        },
      },
      childEvents: {
        select: {
          id: true,
          name: true,
          parentParticipationRequired: true,
          participants: {
            select: {
              profileId: true,
            },
          },
        },
      },
      speakers: {
        select: {
          profileId: true,
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              name: true,
              slug: true,
              logoImageMetaData: {
                select: {
                  path: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
          waitingList: true,
          guests: {
            where: {
              confirmed: true,
              onWaitingList: false,
            },
          },
          childEvents: {
            where: {
              OR: [
                { published: true },
                profileId !== undefined
                  ? {
                      admins: {
                        some: {
                          profileId,
                        },
                      },
                    }
                  : {},
                profileId !== undefined
                  ? {
                      teamMembers: {
                        some: {
                          profileId,
                        },
                      },
                    }
                  : {},
                profileId !== undefined
                  ? {
                      speakers: {
                        some: {
                          profileId,
                        },
                      },
                    }
                  : {},
              ],
            },
          },
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

export async function isAdminOfEvent(
  sessionUser: { id: string } | null,
  event: { id: string }
) {
  if (sessionUser === null) {
    return false;
  }

  const result = await prismaClient.adminOfEvent.findFirst({
    where: {
      profileId: sessionUser.id,
      eventId: event.id,
    },
  });

  return result !== null;
}

function getIsAnyoneAbleToParticipateInEvent(event: {
  inPast: boolean;
  beforeParticipationPeriod: boolean;
  afterParticipationPeriod: boolean;
  canceled: boolean;
  external: boolean;
}) {
  if (
    event.inPast === false &&
    event.beforeParticipationPeriod === false &&
    event.afterParticipationPeriod === false &&
    event.canceled === false &&
    event.external === false
  ) {
    return true;
  }
  return false;
}

export async function deriveModeForEvent(options: {
  sessionUser: { id: string } | null;
  tokenHash: string | null;
  eventInfo: {
    id: string;
    beforeParticipationPeriod: boolean;
    afterParticipationPeriod: boolean;
    inPast: boolean;
    canceled: boolean;
    participantLimit: number | null;
    participantCount: number;
    external: boolean;
    openForRegistration: boolean;
    parentParticipationRequired: boolean | null;
    hasChildEvents: boolean;
    participationToken?: string | null;

    parentEvent: {
      parentParticipationRequired: boolean | null;
      participationToken?: string | null;
      external: boolean;
      participants: { profileId: string }[];
    } | null;
  };
}) {
  const { sessionUser, eventInfo, tokenHash } = options;

  const isAnyoneAbleToParticipate =
    getIsAnyoneAbleToParticipateInEvent(eventInfo);

  // "anon" means that user can participate anonymously (without logging in)
  if (sessionUser === null) {
    // Check if user can in principle participate in the event
    if (isAnyoneAbleToParticipate === false) {
      return null;
    }
    // Check if user should participate on child event
    if (
      eventInfo.hasChildEvents &&
      eventInfo.parentParticipationRequired === false
    ) {
      return null;
    }

    // Check if closed event
    // Therefore, user can only participate via participation link
    if (eventInfo.openForRegistration === false) {
      if (tokenHash !== null && tokenHash === eventInfo.participationToken) {
        return "anon" as const;
      }
      return null;
    }

    // Check if user on child event
    if (eventInfo.parentEvent !== null) {
      // Check if user can participate on child event
      if (
        eventInfo.parentEvent.parentParticipationRequired === false ||
        eventInfo.parentEvent.external
      ) {
        return "anon" as const;
      }
      // Check if user should first participate on parent event
      // Therefore, user can only participate via participation link from parent event
      if (
        eventInfo.parentParticipationRequired !== false &&
        tokenHash !== null &&
        tokenHash === eventInfo.parentEvent.participationToken
      ) {
        return "anon" as const;
      }
      return null;
    }

    return "anon" as const;
  }

  // Check if user can administrate the event
  const adminRelation = await prismaClient.adminOfEvent.findFirst({
    where: {
      profileId: sessionUser.id,
      eventId: eventInfo.id,
    },
  });
  if (adminRelation !== null) {
    return "administrating" as const;
  }

  // Check if is user is participating
  const participantRelation = await prismaClient.participantOfEvent.findFirst({
    where: {
      profileId: sessionUser.id,
      eventId: eventInfo.id,
    },
  });
  if (participantRelation !== null) {
    return "participating" as const;
  }

  // Check if user is on the waiting list
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

  // Check if user can in principle participate in the event
  if (isAnyoneAbleToParticipate === false) {
    return null;
  }

  // Check if closed event
  // Therefore, user can only participate via participation link
  if (
    eventInfo.openForRegistration === false &&
    (tokenHash === null || tokenHash !== eventInfo.participationToken)
  ) {
    return null;
  }

  // Check if user is on parent event and should participate on child event
  if (
    eventInfo.parentEvent === null &&
    eventInfo.parentParticipationRequired === false
  ) {
    return null;
  }

  // Check if user is on child event and should first participate on parent event and isn't already participating on parent event
  if (
    eventInfo.parentEvent !== null &&
    eventInfo.parentParticipationRequired !== false &&
    eventInfo.parentEvent.parentParticipationRequired !== false &&
    eventInfo.parentEvent.participants.some(
      (relation) => relation.profileId === sessionUser.id
    ) === false
  ) {
    return null;
  }

  // Check if user can be added to the waiting list
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
        // is team member
        {
          teamMemberOfEvents: {
            some: {
              eventId: event.id,
            },
          },
        },
        // is speaker
        {
          contributedEvents: {
            some: {
              eventId: event.id,
            },
          },
        },
        // is admin
        {
          administeredEvents: {
            some: {
              eventId: event.id,
            },
          },
        },
        // is admin of the parent event
        {
          administeredEvents: {
            some: {
              event: {
                childEvents: { some: { id: event.id } },
              },
            },
          },
        },
        // is admin of a potential parent event
        {
          administeredEvents: {
            some: {
              event: {
                receivedParentEventJoinRequests: {
                  some: {
                    childEventId: event.id,
                  },
                },
              },
            },
          },
        },
        // is admin of a responsible organization
        {
          administeredOrganizations: {
            some: {
              organization: {
                admins: {
                  some: {
                    profileId: sessionUser.id,
                  },
                },
                responsibleForEvents: {
                  some: {
                    eventId: event.id,
                  },
                },
              },
            },
          },
        },
        // is admin of a potential responsible organization
        {
          administeredOrganizations: {
            some: {
              organization: {
                responsibleForEventInvites: {
                  some: {
                    eventId: event.id,
                  },
                },
              },
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

export async function addProfileToParticipants(options: {
  profileId: string;
  eventId: string;
  locales: {
    mail: {
      subject: { de: string; en: string };
    };
    timezone: { de: string; en: string };
  };
}) {
  const { profileId, eventId, locales } = options;

  let data;
  try {
    data = await prismaClient.participantOfEvent.create({
      data: {
        eventId,
        profileId,
      },
      select: {
        profile: {
          select: {
            firstName: true,
            email: true,
          },
        },
        event: {
          select: {
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
            participationToken: true,
          },
        },
      },
    });
  } catch (error) {
    return { error };
  }

  try {
    setTimeout(async () => {
      try {
        const relation = await prismaClient.participantOfEvent.findFirst({
          where: {
            eventId,
            profileId,
          },
        });

        // Early return if participant has already canceled participation in the meantime
        if (relation === null) {
          return;
        }

        const recipient = data.profile.email;
        const subject = {
          de: insertParametersIntoLocale(locales.mail.subject.de, {
            eventName: data.event.name,
          }),
          en: insertParametersIntoLocale(locales.mail.subject.en, {
            eventName: data.event.name,
          }),
        };

        const zonedStartTime = utcToZonedTime(
          data.event.startTime,
          "Europe/Berlin"
        );
        const zonedEndTime = utcToZonedTime(
          data.event.endTime,
          "Europe/Berlin"
        );

        const date = {
          de: getDuration(zonedStartTime, zonedEndTime, "de"),
          en: getDuration(zonedStartTime, zonedEndTime, "en"),
        };

        const content = {
          headline: subject,
          profile: {
            firstName: data.profile.firstName,
            isGuest: false,
            isOnWaitingList: false,
          },
          event: {
            name: data.event.name,
            url: `${process.env.COMMUNITY_BASE_URL}/event/${data.event.slug}/detail?${PARTICIPATION_TOKEN_HASH_SEARCH_PARAM}=${data.event.participationToken}`, // Add participation token to ensure that guests can participate on child events
            date,
            location: getVenueString(data.event),
            icsLink: `${process.env.COMMUNITY_BASE_URL}/event/${data.event.slug}/ics-download`,
            conferenceLink: data.event.conferenceLink,
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
    }, 1000 * 10); // wait 10 seconds before sending the mail to ensure that participant didn't cancel participation in meantime
  } catch (error) {
    captureException(error);
  }

  return { data };
}

export async function removeProfileFromParticipants(options: {
  profileId: string;
  eventId: string;
  locales: {
    mail: {
      moveFromWaitingListToParticipants: {
        subject: string;
      };
      removeFromParticipants: {
        subject: string;
      };
      guestRemoved: {
        subject: string;
      };
    };
  };
}) {
  const { profileId, eventId } = options;

  const result = await removeParticipantFromEvent({
    id: profileId,
    eventId,
    type: "user",
    locales: {
      ...options.locales.mail,
    },
  });

  return result;
}

export async function addProfileToWaitingList(options: {
  profileId: string;
  eventId: string;
  locales: {
    mail: {
      subject: { de: string; en: string };
    };
    timezone: { de: string; en: string };
  };
}) {
  const { profileId, eventId, locales } = options;

  let data;
  try {
    data = await prismaClient.waitingParticipantOfEvent.create({
      data: {
        eventId,
        profileId,
      },
      select: {
        profile: {
          select: {
            firstName: true,
            email: true,
          },
        },
        event: {
          select: {
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
            participationToken: true,
          },
        },
      },
    });
  } catch (error) {
    return { error };
  }

  try {
    setTimeout(async () => {
      try {
        const relation = await prismaClient.waitingParticipantOfEvent.findFirst(
          {
            where: {
              eventId,
              profileId,
            },
          }
        );

        // Early return if user has already canceled being on the waiting list in the meantime
        if (relation === null) {
          return;
        }

        const recipient = data.profile.email;
        const subject = {
          de: insertParametersIntoLocale(locales.mail.subject.de, {
            eventName: data.event.name,
          }),
          en: insertParametersIntoLocale(locales.mail.subject.en, {
            eventName: data.event.name,
          }),
        };

        const zonedStartTime = utcToZonedTime(
          data.event.startTime,
          "Europe/Berlin"
        );
        const zonedEndTime = utcToZonedTime(
          data.event.endTime,
          "Europe/Berlin"
        );

        const date = {
          de: getDuration(zonedStartTime, zonedEndTime, "de"),
          en: getDuration(zonedStartTime, zonedEndTime, "en"),
        };

        const content = {
          headline: subject,
          profile: {
            firstName: data.profile.firstName,
            isGuest: false,
            isOnWaitingList: true,
          },
          event: {
            name: data.event.name,
            url: `${process.env.COMMUNITY_BASE_URL}/event/${data.event.slug}/detail?${PARTICIPATION_TOKEN_HASH_SEARCH_PARAM}=${data.event.participationToken}`, // Add participation token to ensure that guests can participate on child events
            date,
            location: getVenueString(data.event),
            icsLink: `${process.env.COMMUNITY_BASE_URL}/event/${data.event.slug}/ics-download`,
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
    }, 1000 * 10); // wait 10 seconds before sending the mail to ensure that user didn't cancel being on the waiting list in meantime
  } catch (error) {
    captureException(error);
  }

  return { data };
}

export async function removeProfileFromWaitingList(options: {
  profileId: string;
  eventId: string;
  locales: {
    mail: {
      removeFromWaitingList: {
        subject: string;
      };
    };
  };
}) {
  const { profileId, eventId, locales } = options;
  let data;
  try {
    data = await prismaClient.waitingParticipantOfEvent.delete({
      where: {
        profileId_eventId: {
          eventId,
          profileId,
        },
      },
      select: {
        profile: {
          select: {
            firstName: true,
            email: true,
          },
        },
        event: {
          select: {
            name: true,
          },
        },
      },
    });
  } catch (error) {
    return { error };
  }

  try {
    setTimeout(async () => {
      const relation = await prismaClient.waitingParticipantOfEvent.findFirst({
        where: {
          eventId,
          profileId,
        },
      });

      // Early return if user has already rejoined the waiting list in the meantime
      if (relation !== null) {
        return;
      }

      const recipient = data.profile.email;
      const subject = insertParametersIntoLocale(
        locales.mail.removeFromWaitingList.subject,
        {
          eventName: data.event.name,
        }
      );

      const content = {
        headline: subject,
        profile: {
          firstName: data.profile.firstName,
          isOnWaitingList: true,
        },
        event: {
          name: data.event.name,
        },
      };

      const textTemplatePath =
        "mail-templates/event/profile-or-guest-removed-from-participants-or-waiting-list-text.hbs";
      const htmlTemplatePath =
        "mail-templates/event/profile-or-guest-removed-from-participants-or-waiting-list-html.hbs";
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
        subject,
        plainText: text,
        html,
      });
    }, 1000 * 10); // wait 10 seconds before sending the mail to ensure that user didn't rejoin waiting list in the meantime
  } catch (error) {
    return { error };
  }
  return { data };
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

export async function uploadBackgroundImage(options: {
  request: Request;
  formData: FormData;
  authClient: SupabaseClient;
  slug: string;
  locales: {
    errors: {
      background: {
        upload: string;
      };
    };
    upload: {
      validation: {
        image: {
          size: string;
          type: string;
        };
      };
      selection: {
        select: string;
        empty: string;
      };
    };
    imageCropper: {
      imageCropper: {
        error: string;
        confirmation: string;
        disconnect: string;
        reset: string;
        submit: string;
      };
    };
    success: {
      imageAdded: string;
      imageTypes: {
        background: string;
        avatar: string;
        logo: string;
      };
    };
  };
}) {
  const { request, formData, authClient, slug, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: createImageUploadSchema(locales).transform(async (data, ctx) => {
      const { file, bucket, uploadKey } = data;
      const { fileMetadataForDatabase, error } = await uploadFileToStorage({
        file,
        authClient,
        bucket,
      });
      if (error !== null) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.errors.background.upload,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      if (uploadKey !== "background") {
        ctx.addIssue({
          code: "custom",
          message: locales.errors.background.upload,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      try {
        await prismaClient.event.update({
          where: {
            slug,
          },
          data: {
            backgroundImageMetaData: {
              upsert: {
                create: {
                  ...fileMetadataForDatabase,
                },
                update: {
                  ...fileMetadataForDatabase,
                },
              },
            },
          },
        });
      } catch (error) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.errors.background.upload,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }

      return { ...data, uploadKey: uploadKey };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null, redirectUrl: null };
  }

  // Close modal after redirect
  const redirectUrl = submission.value.redirectTo || new URL(request.url);
  if (typeof redirectUrl !== "string") {
    redirectUrl.searchParams.delete(`modal-${submission.value.uploadKey}`);
  }
  return {
    submission: null,
    toast: {
      id: "change-image",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.success.imageAdded, {
        imageType: locales.success.imageTypes[submission.value.uploadKey],
      }),
    },
    redirectUrl: redirectUrl.toString(),
  };
}

export async function disconnectBackgroundImage(options: {
  request: Request;
  formData: FormData;
  slug: string;
  locales: {
    errors: {
      background: {
        upload: string;
      };
    };
    success: {
      imageRemoved: string;
      imageTypes: {
        background: string;
        avatar: string;
        logo: string;
      };
    };
  };
}) {
  const { request, formData, slug, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: disconnectImageSchema.transform(async (data, ctx) => {
      const { uploadKey } = data;
      if (uploadKey !== "background") {
        ctx.addIssue({
          code: "custom",
          message: locales.errors.background.upload,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      try {
        await prismaClient.event.update({
          where: {
            slug,
          },
          data: {
            backgroundImageMetaData: {
              delete: true,
            },
          },
        });
      } catch (error) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.errors.background.upload,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }

      return { ...data, uploadKey: uploadKey };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null, redirectUrl: null };
  }

  // Close modal after redirect
  const redirectUrl = submission.value.redirectTo || new URL(request.url);
  if (typeof redirectUrl !== "string") {
    redirectUrl.searchParams.delete(`modal-${submission.value.uploadKey}`);
  }
  return {
    submission: null,
    toast: {
      id: "disconnect-image",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.success.imageRemoved, {
        imageType: locales.success.imageTypes[submission.value.uploadKey],
      }),
    },
    redirectUrl: redirectUrl.toString(),
  };
}

export async function getContactPersonsOfEvent(options: {
  slug: string;
  sessionUser: User | null;
  authClient: SupabaseClient;
}) {
  const { slug, sessionUser, authClient } = options;

  const contactPersons = await prismaClient.contactPersonOfEvent.findMany({
    where: {
      event: {
        slug,
      },
    },
    select: {
      profile: {
        select: {
          id: true,
          username: true,
          academicTitle: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarImageMetaData: {
            select: {
              path: true,
            },
          },
          position: true,
          profileVisibility: {
            select: {
              id: true,
              username: true,
              academicTitle: true,
              firstName: true,
              email: true,
              phone: true,
              lastName: true,
              avatarImageMetaData: true,
              position: true,
            },
          },
        },
      },
    },
  });

  const enhancedContactPersons = contactPersons.map((contactPerson) => {
    // Apply profile visibility settings
    let filteredContactPerson;
    if (sessionUser === null) {
      filteredContactPerson = filterProfileByVisibility<
        typeof contactPerson.profile
      >(contactPerson.profile);
    } else {
      filteredContactPerson = { ...contactPerson.profile };
    }

    let avatar =
      filteredContactPerson.avatarImageMetaData === null
        ? null
        : filteredContactPerson.avatarImageMetaData.path;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.Event.Detail.ListItem.Avatar,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.Event.Detail.ListItem.BlurredAvatar,
          },
          blur: BlurFactor,
        });
      }
    }

    return { ...filteredContactPerson, avatar, blurredAvatar };
  });

  return enhancedContactPersons;
}

export async function getParticipantsCount(
  slug: string,
  sessionUser: User | null
) {
  const participants = await prismaClient.participantOfEvent.findMany({
    where: {
      OR: [
        {
          event: {
            slug,
          },
        },
        {
          event: {
            AND: [
              {
                parentEvent: {
                  slug,
                  external: false,
                  openForRegistration: true,
                },
              },
              {
                OR: [
                  { published: true },
                  sessionUser !== null
                    ? {
                        teamMembers: {
                          some: { profileId: sessionUser?.id },
                        },
                        admins: {
                          some: { profileId: sessionUser?.id },
                        },
                        speakers: {
                          some: { profileId: sessionUser?.id },
                        },
                      }
                    : {},
                ],
              },
            ],
          },
        },
      ],
    },
    distinct: ["profileId"],
  });

  return participants.length;
}

export async function addGuestToEvent(options: {
  eventId: string;
  guest: {
    email: string;
    academicTitle?: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
  };
  locales: {
    mail: {
      profileAlreadyExists: {
        subject: string;
      };
      guestAlreadyExists: {
        subject: string;
      };
      confirmRegistration: {
        subject: string;
      };
    };
  };
  redirectUrl: string;
}) {
  const { eventId, guest } = options;

  const event = await prismaClient.event.findUnique({
    where: {
      id: eventId,
    },
    select: {
      name: true,
      participationToken: true,
      _count: {
        select: {
          childEvents: true,
        },
      },
    },
  });

  if (event === null) {
    throw new Error("Event not found");
  }

  const existingProfile = await prismaClient.profile.findFirst({
    where: {
      email: guest.email,
    },
    select: {
      firstName: true,
    },
  });

  if (existingProfile !== null) {
    try {
      const sender = process.env.SYSTEM_MAIL_SENDER;
      const recipient = guest.email;
      const subject = options.locales.mail.profileAlreadyExists.subject;
      const textTemplatePath =
        "mail-templates/guests/profile-already-exists-text.hbs";
      const htmlTemplatePath =
        "mail-templates/guests/profile-already-exists-html.hbs";

      const data = {
        firstName: existingProfile.firstName,
        eventName: event.name,
        buttonUrl: `${process.env.COMMUNITY_BASE_URL}/login?login_redirect=${encodeURIComponent(options.redirectUrl)}`,
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
    return null;
  }

  const existingGuest = await prismaClient.guest.findFirst({
    where: {
      eventId,
      email: guest.email,
    },
    select: {
      firstName: true,
      confirmed: true,
      revocationToken: true,
    },
  });

  if (existingGuest !== null && existingGuest.confirmed) {
    try {
      const sender = process.env.SYSTEM_MAIL_SENDER;
      const recipient = guest.email;
      const subject = options.locales.mail.guestAlreadyExists.subject;
      const textTemplatePath =
        "mail-templates/guests/guest-already-exists-text.hbs";
      const htmlTemplatePath =
        "mail-templates/guests/guest-already-exists-html.hbs";

      // Use plain URL without parameters
      const confirmationRedirectUrl = new URL(
        `${process.env.COMMUNITY_BASE_URL}${options.redirectUrl}`
      );
      const confirmationRedirectWithoutParams = `${confirmationRedirectUrl.origin}${confirmationRedirectUrl.pathname}`;

      const data = {
        firstName: existingGuest.firstName,
        eventName: event.name,
        buttonUrl: `${process.env.COMMUNITY_BASE_URL}/auth/guest/confirm?type=revoke&confirmation_link=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/auth/guest/verify?type=revoke&token_hash=${existingGuest.revocationToken}&confirmation_redirect=${encodeURIComponent(confirmationRedirectWithoutParams)}`)}`,
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
      console.log(error);
      captureException(error);
    }
    return null;
  }

  const data = JSON.stringify({
    eventId,
    email: guest.email,
    now: Date.now(),
  });

  const token = generateValidationToken({
    data,
    secret: process.env.GUEST_SECRET,
    salt: process.env.GUEST_SALT,
  });

  let result;
  if (existingGuest !== null && existingGuest.confirmed === false) {
    result = await prismaClient.guest.update({
      where: {
        email_eventId: {
          eventId,
          email: guest.email,
        },
      },
      data: {
        ...guest,
        confirmationToken: token,
      },
      select: {
        firstName: true,
        email: true,
      },
    });
  } else {
    result = await prismaClient.guest.create({
      data: {
        eventId,
        ...guest,
        confirmationToken: token,
      },
      select: {
        firstName: true,
        email: true,
      },
    });
  }

  try {
    const sender = process.env.SYSTEM_MAIL_SENDER;
    const recipient = result.email;
    const subject = options.locales.mail.confirmRegistration.subject;
    const textTemplatePath =
      "mail-templates/guests/confirm-registration-text.hbs";
    const htmlTemplatePath =
      "mail-templates/guests/confirm-registration-html.hbs";

    const redirectUrl = new URL(
      `${process.env.COMMUNITY_BASE_URL}${options.redirectUrl}`
    );
    let participationToken = redirectUrl.searchParams.get(
      PARTICIPATION_TOKEN_HASH_SEARCH_PARAM
    );
    let participateOnEventIntent = redirectUrl.searchParams.get(
      PARTICIPATE_ON_EVENT_INTENT_SEARCH_PARAM
    );

    if (
      participationToken === null &&
      event._count.childEvents > 0 &&
      event.participationToken !== null
    ) {
      participationToken = event.participationToken;
    }

    const searchParams = new URLSearchParams();
    if (participationToken !== null) {
      searchParams.set(
        PARTICIPATION_TOKEN_HASH_SEARCH_PARAM,
        participationToken
      );
    }
    if (participateOnEventIntent !== null) {
      searchParams.set(
        PARTICIPATE_ON_EVENT_INTENT_SEARCH_PARAM,
        participateOnEventIntent
      );
    }
    redirectUrl.search = searchParams.toString();

    const data = {
      firstName: result.firstName,
      eventName: event.name,
      buttonUrl: `${process.env.COMMUNITY_BASE_URL}/auth/guest/confirm?confirmation_link=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/auth/guest/verify?token_hash=${token}&confirmation_redirect=${redirectUrl.toString()}`)}`,
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

  return null;
}
