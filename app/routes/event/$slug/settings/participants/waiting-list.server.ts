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
      published: true,
      external: true,
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
  let guestWaitingList = [];

  const waitingListSelect = {
    createdAt: true,
    profile: {
      select: {
        id: true,
        email: true,
        academicTitle: true,
        firstName: true,
        lastName: true,
        avatarImageMetaData: {
          select: {
            path: true,
          },
        },
      },
    },
  };

  const guestWaitingListSelect = {
    id: true,
    email: true,
    academicTitle: true,
    firstName: true,
    lastName: true,
    createdAt: true,
  };

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_WAITING_LIST_SEARCH_PARAM] === "undefined"
  ) {
    waitingList = await prismaClient.waitingParticipantOfEvent.findMany({
      where: {
        eventId,
      },
      select: waitingListSelect,
    });
    guestWaitingList = await prismaClient.guest.findMany({
      where: {
        eventId,
        onWaitingList: true,
      },
      select: guestWaitingListSelect,
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
      select: waitingListSelect,
    });
    guestWaitingList = await prismaClient.guest.findMany({
      where: {
        eventId,
        onWaitingList: true,
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
      select: guestWaitingListSelect,
    });
  }

  const allWaitingList = [
    ...waitingList.map((participant) => {
      return {
        ...participant.profile,
        createdAt: participant.createdAt,
        type: "participant" as const,
      };
    }),
    ...guestWaitingList.map((guest) => {
      return {
        ...guest,
        avatarImageMetaData: null,
        type: "guest" as const,
      };
    }),
  ].sort((a, b) => {
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const enhancedWaitingList = allWaitingList.map((participantOnWaitingList) => {
    let avatar =
      participantOnWaitingList.avatarImageMetaData !== null
        ? participantOnWaitingList.avatarImageMetaData.path
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

    return { ...participantOnWaitingList, avatar, blurredAvatar };
  });

  return { submission: submission.reply(), waitingList: enhancedWaitingList };
}

export async function moveToParticipants(options: {
  profileId: string;
  eventId: string;
  type: "participant" | "guest";
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { profileId, eventId, type } = options;

  let result;
  if (type === "guest") {
    result = await prismaClient.guest.update({
      where: {
        id: profileId,
      },
      data: {
        onWaitingList: false,
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
  } else {
    const transactionResults = await prismaClient.$transaction([
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
    result = {
      ...transactionResults[0].profile,
      event: transactionResults[0].event,
    };
  }

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = result.email;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/general-notification/move-from-waiting-list-to-participants-of-event-text.hbs";
  const htmlTemplatePath =
    "mail-templates/general-notification/move-from-waiting-list-to-participants-of-event-html.hbs";

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    {
      firstName: result.firstName,
      event: { name: result.event.name },
    },
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    {
      firstName: result.firstName,
      event: { name: result.event.name },
    },
    "html"
  );

  await mailer(mailerOptions, sender, recipient, subject, text, html);

  return result;
}
