import { parseWithZod } from "@conform-to/zod";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { filterProfileByVisibility } from "~/public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import {
  getSearchParticipantsSchema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./participants.shared";

export async function getParticipantsOfEvent(options: {
  slug: string;
  authClient: SupabaseClient;
  sessionUser: User | null;
  searchParams: URLSearchParams;
}) {
  const { slug, authClient, sessionUser, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: getSearchParticipantsSchema(),
  });

  let profiles = [];
  let guests = [];

  const profileWhere = {
    participatedEvents: {
      some: {
        OR: [
          { event: { slug } },
          {
            event: {
              parentEvent: {
                slug,
              },
            },
          },
        ],
      },
    },
  };

  const guestWhere = {
    OR: [
      {
        event: {
          slug,
        },
      },
      {
        event: {
          parentEvent: {
            slug,
          },
        },
      },
    ],
    confirmed: true,
    onWaitingList: false,
  };

  const profileSelect = {
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
    position: true,
    profileVisibility: {
      select: {
        id: true,
        username: true,
        academicTitle: true,
        firstName: true,
        lastName: true,
        avatarImageMetaData: true,
        email: true,
        position: true,
      },
    },
  };
  const guestSelect = {
    id: true,
    academicTitle: true,
    firstName: true,
    lastName: true,
  };

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM] === "undefined"
  ) {
    const transactionResult = await prismaClient.$transaction([
      prismaClient.profile.findMany({
        where: profileWhere,
        select: profileSelect,
        distinct: ["username"],
      }),
      prismaClient.guest.findMany({
        where: guestWhere,
        select: guestSelect,
        distinct: ["email"],
      }),
    ]);
    profiles = transactionResult[0];
    guests = transactionResult[1];
  } else {
    const query =
      submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM].trim().split(" ");

    const transactionResult = await prismaClient.$transaction([
      prismaClient.profile.findMany({
        where: {
          ...profileWhere,
          OR: query.map((term) => {
            return {
              OR: [
                { firstName: { contains: term, mode: "insensitive" } },
                { lastName: { contains: term, mode: "insensitive" } },
              ],
            };
          }),
        },
        select: profileSelect,
        distinct: ["username"],
      }),
      prismaClient.guest.findMany({
        where: {
          ...guestWhere,
          OR: query.map((term) => {
            return {
              OR: [
                { firstName: { contains: term, mode: "insensitive" } },
                { lastName: { contains: term, mode: "insensitive" } },
              ],
            };
          }),
        },
        select: guestSelect,
        distinct: ["email"],
      }),
    ]);
    profiles = transactionResult[0];
    guests = transactionResult[1];
  }

  const enhancedParticipants = profiles.map((participant) => {
    let avatar =
      participant.avatarImageMetaData === null
        ? null
        : participant.avatarImageMetaData.path;
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

    // Apply profile visibility settings
    let filteredParticipant;
    if (sessionUser === null) {
      filteredParticipant =
        filterProfileByVisibility<typeof participant>(participant);
    } else {
      filteredParticipant = {
        ...participant,
        avatar,
        blurredAvatar,
      };
    }

    return filteredParticipant;
  });

  const allParticipants = [
    ...enhancedParticipants.map((participant) => {
      const { profileVisibility: _profileVisibility, ...rest } = participant;
      return {
        ...rest,
      };
    }),
    ...guests.map((guest) => {
      return {
        ...guest,
        position: null,
        username: null,
      };
    }),
  ].sort((a, b) => {
    return a.lastName.localeCompare(b.lastName);
  });

  return { submission: submission.reply(), participants: allParticipants };
}

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      canceled: true,
      participantLimit: true,
      participationFrom: true,
      participationUntil: true,
      endTime: true,
      external: true,
      published: true,
      openForRegistration: true,
      parentParticipationRequired: true,
      parentEvent: {
        select: {
          parentParticipationRequired: true,
          external: true,
          participants: {
            select: {
              profileId: true,
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
          guests: {
            where: {
              confirmed: true,
              onWaitingList: false,
            },
          },
          childEvents: true,
        },
      },
    },
  });

  return event;
}
