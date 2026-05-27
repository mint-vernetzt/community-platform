import { type SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import {
  createSearchParticipantsSchema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./list.shared";
import { parseWithZod } from "@conform-to/zod";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { captureException } from "@sentry/node";

export async function getParticipantsOfEvent(options: {
  eventId: string;
  authClient: SupabaseClient;
  searchParams: URLSearchParams;
}) {
  const { eventId, authClient, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: createSearchParticipantsSchema(),
  });

  let participants = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM] === "undefined"
  ) {
    participants = await prismaClient.participantOfEvent.findMany({
      where: {
        eventId,
      },
      select: {
        createdAt: true,
        profile: {
          select: {
            id: true,
            username: true,
            academicTitle: true,
            firstName: true,
            lastName: true,
            avatarImageMetaData: {
              select: {
                path: true,
              },
            },
            createdAt: true,
          },
        },
      },
    });
  } else {
    const query =
      submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM].trim().split(" ");

    participants = await prismaClient.participantOfEvent.findMany({
      where: {
        eventId,
        profile: {
          OR: query.map((term) => {
            return {
              OR: [
                { firstName: { contains: term, mode: "insensitive" } },
                { lastName: { contains: term, mode: "insensitive" } },
                { email: { contains: term, mode: "insensitive" } },
              ],
            };
          }),
        },
      },
      select: {
        createdAt: true,
        profile: {
          select: {
            id: true,
            username: true,
            academicTitle: true,
            firstName: true,
            lastName: true,
            avatarImageMetaData: {
              select: {
                path: true,
              },
            },
            createdAt: true,
          },
        },
      },
    });
  }

  const enhancedParticipants = participants.map((participant) => {
    let avatar =
      participant.profile.avatarImageMetaData !== null
        ? participant.profile.avatarImageMetaData.path
        : null;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItem.Avatar,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItem.BlurredAvatar,
          },
          blur: BlurFactor,
        });
      }
    }

    return { ...participant.profile, avatar, blurredAvatar };
  });

  return { submission: submission.reply(), participants: enhancedParticipants };
}

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
    },
  });
  return event;
}

export async function removeParticipantFromEvent(options: {
  participantId: string;
  eventId: string;
  locales: {
    mail: {
      removeFromParticipants: {
        subject: string;
      };
      moveFromWaitingListToParticipants: {
        subject: string;
      };
    };
  };
}) {
  const { participantId, eventId } = options;

  const result = await prismaClient.participantOfEvent.delete({
    where: {
      profileId_eventId: {
        profileId: participantId,
        eventId,
      },
    },
    select: {
      profile: {
        select: {
          username: true,
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
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = result.profile.email;
  const subject = options.locales.mail.removeFromParticipants.subject;
  const textTemplatePath =
    "mail-templates/general-notification/remove-participant-from-event-text.hbs";
  const htmlTemplatePath =
    "mail-templates/general-notification/remove-participant-from-event-html.hbs";

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    {
      firstName: result.profile.firstName,
      event: { name: result.event.name },
    },
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    {
      firstName: result.profile.firstName,
      event: { name: result.event.name },
    },
    "html"
  );

  await mailer(mailerOptions, sender, recipient, subject, text, html);

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

  return result;
}
