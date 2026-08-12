import { parseWithZod } from "@conform-to/zod";
import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { scheduleMail } from "~/mailer-queue.server";
import { getCompiledMailTemplate } from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { getVenueString } from "~/utils.shared";
import {
  createSearchWaitingListSchema,
  SEARCH_WAITING_LIST_SEARCH_PARAM,
} from "./waiting-list.shared";

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
    const guest = (result = await prismaClient.guest.update({
      where: {
        id: profileId,
      },
      data: {
        onWaitingList: false,
      },
      select: {
        email: true,
        firstName: true,
        revocationToken: true,
        event: {
          select: {
            slug: true,
            name: true,
            startTime: true,
            venueName: true,
            venueStreet: true,
            venueStreetNumber: true,
            venueZipCode: true,
            venueCity: true,
            conferenceLink: true,
          },
        },
      },
    }));
    result = {
      ...guest,
      type: "guest" as const,
    };
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
              slug: true,
              name: true,
              startTime: true,
              venueName: true,
              venueStreet: true,
              venueStreetNumber: true,
              venueZipCode: true,
              venueCity: true,
              conferenceLink: true,
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
      type: "participant" as const,
    };
  }

  const recipient = result.email;
  const subject = insertParametersIntoLocale(options.locales.mail.subject, {
    eventName: result.event.name,
  });

  const content = {
    headline: subject,
    profile: {
      firstName: result.firstName,
      isGuest: type === "guest",
    },
    event: {
      name: result.event.name,
      url: `${process.env.COMMUNITY_BASE_URL}/event/${result.event.slug}/detail`,
      startDate: result.event.startTime.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      startTime: result.event.startTime.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timezone: "MEZ",
      location: getVenueString(result.event),
      conferenceLink: result.event.conferenceLink,
      revocationLink: null as string | null,
    },
  };

  if (result.type === "guest") {
    const revocationLink = `${process.env.COMMUNITY_BASE_URL}/auth/guest/confirm?type=revoke&confirmation_link=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/auth/guest/verify?type=revoke&token_hash=${result.revocationToken}&confirmation_redirect=${encodeURIComponent(`${process.env.COMMUNITY_BASE_URL}/event/${result.event.slug}/detail`)}`)}`;
    content.event.revocationLink = revocationLink;
  }

  const textTemplatePath =
    "mail-templates/event/profile-or-guest-moved-up-to-participants-text.hbs";
  const htmlTemplatePath =
    "mail-templates/event/profile-or-guest-moved-up-to-participants-html.hbs";

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

  return result;
}
