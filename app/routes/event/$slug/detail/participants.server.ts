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

  let participants = [];

  const where = {
    participatedEvents: {
      some: {
        OR: [
          { event: { slug } },
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
    },
  };

  const select = {
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
        position: true,
      },
    },
  };

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM] === "undefined"
  ) {
    participants = await prismaClient.profile.findMany({
      where,
      select,
      distinct: ["username"],
    });
  } else {
    const query =
      submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM].trim().split(" ");

    participants = await prismaClient.profile.findMany({
      where: {
        ...where,
        OR: query.map((term) => {
          return {
            OR: [
              { firstName: { contains: term, mode: "insensitive" } },
              { lastName: { contains: term, mode: "insensitive" } },
              { username: { contains: term, mode: "insensitive" } },
            ],
          };
        }),
      },
      select,
      distinct: ["username"],
    });
  }

  const enhancedParticipants = participants.map((participant) => {
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

  return { submission: submission.reply(), participants: enhancedParticipants };
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
      openForRegistration: true,
      parentParticipationRequired: true,
      parentEvent: {
        select: {
          parentParticipationRequired: true,
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
          childEvents: true,
        },
      },
    },
  });

  return event;
}
