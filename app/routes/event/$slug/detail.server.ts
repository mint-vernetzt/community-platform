import { parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { z } from "zod";
import {
  getReporter,
  sendNewReportMailToSupport,
} from "~/abuse-reporting.server";
import {
  createImageUploadSchema,
  disconnectImageSchema,
} from "~/components/legacy/ImageCropper/ImageCropper";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { filterProfileByVisibility } from "~/public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL, uploadFileToStorage } from "~/storage.server";
import { FILE_FIELD_NAME } from "~/storage.shared";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";

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

export async function deriveModeForEvent(
  sessionUser: { id: string } | null,
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
    parentEvent: {
      parentParticipationRequired: boolean | null;
      participants: { profileId: string }[];
    } | null;
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
    eventInfo.beforeParticipationPeriod ||
    eventInfo.canceled ||
    eventInfo.external ||
    eventInfo.openForRegistration === false ||
    (eventInfo.hasChildEvents &&
      eventInfo.parentParticipationRequired === false) ||
    (eventInfo.parentEvent !== null &&
      eventInfo.parentParticipationRequired !== false &&
      eventInfo.parentEvent.parentParticipationRequired === true &&
      eventInfo.parentEvent.participants.some(
        (relation) => relation.profileId === sessionUser.id
      ) === false)
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
        },
        {
          contributedEvents: {
            some: {
              eventId: event.id,
            },
          },
        },
        {
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

export async function removeProfileFromParticipants(options: {
  profileId: string;
  eventId: string;
  locales: {
    mail: {
      moveFromWaitingListToParticipants: {
        subject: string;
      };
    };
  };
}) {
  const { profileId, eventId } = options;

  let data: Awaited<
    ReturnType<typeof prismaClient.participantOfEvent.deleteMany>
  >;

  try {
    data = await prismaClient.participantOfEvent.deleteMany({
      where: {
        eventId,
        profileId,
      },
    });
  } catch (error) {
    console.error("Error removing profile from participants:", error);
    captureException(error);
    return { error };
  }

  // Try to move first profile from waiting list to participants
  try {
    const event = await prismaClient.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        moveUpToParticipants: true,
        participantLimit: true,
        _count: {
          select: {
            participants: true,
          },
        },
        waitingList: {
          select: {
            profileId: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (event === null) {
      throw new Error("Event not found");
    }

    if (
      event.moveUpToParticipants &&
      event.participantLimit !== null &&
      event._count.participants < event.participantLimit &&
      event.waitingList.length > 0
    ) {
      const firstInWaitingList = event.waitingList[0];
      const result = await prismaClient.$transaction([
        prismaClient.participantOfEvent.create({
          data: {
            eventId,
            profileId: firstInWaitingList.profileId,
          },
          select: {
            profile: {
              select: {
                email: true,
                firstName: true,
              },
            },
            event: {
              select: {
                name: true,
              },
            },
          },
        }),
        prismaClient.waitingParticipantOfEvent.delete({
          where: {
            profileId_eventId: {
              eventId,
              profileId: firstInWaitingList.profileId,
            },
          },
        }),
      ]);

      const sender = process.env.SYSTEM_MAIL_SENDER;
      const recipient = result[0].profile.email;
      const subject =
        options.locales.mail.moveFromWaitingListToParticipants.subject;
      const textTemplatePath =
        "mail-templates/general-notification/move-from-waiting-list-to-participants-of-event-text.hbs";
      const htmlTemplatePath =
        "mail-templates/general-notification/move-from-waiting-list-to-participants-of-event-html.hbs";

      const text = getCompiledMailTemplate<typeof textTemplatePath>(
        textTemplatePath,
        {
          firstName: result[0].profile.firstName,
          event: { name: result[0].event.name },
        },
        "text"
      );
      const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
        htmlTemplatePath,
        {
          firstName: result[0].profile.firstName,
          event: { name: result[0].event.name },
        },
        "html"
      );

      await mailer(mailerOptions, sender, recipient, subject, text, html);
    }
  } catch (error) {
    console.error("Error sending mail after removing participant:", error);
    captureException(error);
  }

  return { data };
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
