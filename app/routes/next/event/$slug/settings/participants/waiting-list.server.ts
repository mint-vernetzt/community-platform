import { parseWithZod } from "@conform-to/zod";
import { type SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import {
  createSearchWaitingListSchema,
  SEARCH_WAITING_LIST_SEARCH_PARAM,
} from "./waiting-list.shared";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      moveUpToParticipants: true,
    },
  });
  return event;
}

export async function getWaitingListOfEvent(options: {
  eventId: string;
  authClient: SupabaseClient;
  searchParams: URLSearchParams;
}) {
  const { eventId, authClient, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: createSearchWaitingListSchema(),
  });

  let waitingList = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_WAITING_LIST_SEARCH_PARAM] === "undefined"
  ) {
    waitingList = await prismaClient.waitingParticipantOfEvent.findMany({
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
            avatarImage: {
              select: {
                path: true,
              },
            },
            createdAt: true,
          },
        },
      },
      orderBy: {
        profile: {
          createdAt: "asc",
        },
      },
    });
  } else {
    const query =
      submission.value[SEARCH_WAITING_LIST_SEARCH_PARAM].trim().split(" ");

    waitingList = await prismaClient.waitingParticipantOfEvent.findMany({
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
            avatarImage: {
              select: {
                path: true,
              },
            },
            createdAt: true,
          },
        },
      },
      orderBy: {
        profile: {
          createdAt: "asc",
        },
      },
    });
  }

  const enhancedWaitingList = waitingList.map((participantOnWaitingList) => {
    let avatar =
      participantOnWaitingList.profile.avatarImage !== null
        ? participantOnWaitingList.profile.avatarImage.path
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

    return { ...participantOnWaitingList.profile, avatar, blurredAvatar };
  });

  return { submission: submission.reply(), waitingList: enhancedWaitingList };
}

export async function moveToParticipants(options: {
  profileId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { profileId, eventId } = options;

  const result = await prismaClient.$transaction([
    prismaClient.participantOfEvent.create({
      data: {
        eventId,
        profileId,
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
          profileId,
        },
      },
    }),
  ]);

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = result[0].profile.email;
  const subject = options.locales.mail.subject;
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

  return result;
}
