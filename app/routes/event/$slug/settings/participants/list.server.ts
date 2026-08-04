import { parseWithZod } from "@conform-to/zod";
import { type SupabaseClient } from "@supabase/supabase-js";
import {
  getChildEventsRemovalCascadesInto,
  getEventsParticipantWillBeRemovedFrom,
  removeParticipantFromEvent,
  type ParticipantIdentifier,
} from "~/events.server";
import { ParticipationType } from "~/events.shared";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import {
  createSearchParticipantsSchema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./list.shared";

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
  let guests = [];

  const participantsSelect = {
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

  const guestsSelect = {
    id: true,
    email: true,
    academicTitle: true,
    firstName: true,
    lastName: true,
    createdAt: true,
  };

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM] === "undefined"
  ) {
    participants = await prismaClient.participantOfEvent.findMany({
      where: {
        eventId,
      },
      select: participantsSelect,
    });

    guests = await prismaClient.guest.findMany({
      where: {
        eventId,
        onWaitingList: false,
      },
      select: guestsSelect,
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
      select: participantsSelect,
    });

    guests = await prismaClient.guest.findMany({
      where: {
        eventId,
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
      select: guestsSelect,
    });
  }

  const allParticipants = [
    ...participants.map((participant) => {
      return {
        ...participant.profile,
        createdAt: participant.createdAt,
        type: ParticipationType.User,
      };
    }),
    ...guests.map((guest) => {
      return {
        ...guest,
        avatarImageMetaData: null,
        type: ParticipationType.Guest,
      };
    }),
  ].sort((a, b) => {
    return b.createdAt.getTime() - a.createdAt.getTime(); // Sort by createdAt descending
  });

  const childEvents = await getChildEventsRemovalCascadesInto({ eventId });

  const enhancedParticipants = allParticipants.map((participant) => {
    let identifier: ParticipantIdentifier;
    if (participant.type === ParticipationType.Guest) {
      identifier = { type: "guest", email: participant.email };
    } else {
      identifier = { type: "user", profileId: participant.id };
    }
    const eventsToBeRemovedFrom = getEventsParticipantWillBeRemovedFrom({
      identifier,
      childEvents,
    });

    let avatar =
      participant.avatarImageMetaData !== null
        ? participant.avatarImageMetaData.path
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

    return {
      ...participant,
      avatar,
      blurredAvatar,
      eventsToBeRemovedFrom,
    };
  });

  return {
    submission: submission.reply(),
    participants: enhancedParticipants,
  };
}

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      published: true,
      external: true,
      openForRegistration: true,
      parentParticipationRequired: true,
      childEvents: {
        select: {
          participants: {
            select: {
              profileId: true,
            },
          },
        },
      },
    },
  });
  return event;
}

export async function removeFromEvent(options: {
  participantId: string;
  eventId: string;
  type: (typeof ParticipationType)[keyof typeof ParticipationType];
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

  const result = await removeParticipantFromEvent({
    id: participantId,
    eventId,
    type: options.type,
    notifyUsers: true,
    recursively: true,
    locales: {
      ...options.locales.mail,
      guestRemoved: {
        subject: options.locales.mail.removeFromParticipants.subject,
      },
    }, // TODO: improve TS
  });

  return result;
}
