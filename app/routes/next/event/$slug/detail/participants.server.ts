import { parseWithZod } from "@conform-to/zod-v1";
import { type User, type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import {
  getSearchParticipantsSchmema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./participants.shared";

export async function getParticipantsOfEvent(options: {
  slug: string;
  authClient: SupabaseClient;
  sessionUser: User | null;
  searchParams: URLSearchParams;
}) {
  const { slug, authClient, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: getSearchParticipantsSchmema(),
  });

  let participants = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM] === "undefined"
  ) {
    participants = await prismaClient.profile.findMany({
      where: {
        participatedEvents: { some: { event: { slug } } },
      },
      select: {
        id: true,
        username: true,
        academicTitle: true,
        firstName: true,
        lastName: true,
        avatar: true,
        position: true,
        profileVisibility: {
          select: {
            academicTitle: true,
            avatar: true,
            position: true,
          },
        },
      },
    });
  } else {
    const query =
      submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM].trim().split(" ");

    participants = await prismaClient.profile.findMany({
      where: {
        participatedEvents: { some: { event: { slug } } },
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
      select: {
        id: true,
        username: true,
        academicTitle: true,
        firstName: true,
        lastName: true,
        avatar: true,
        position: true,
        profileVisibility: {
          select: {
            academicTitle: true,
            avatar: true,
            position: true,
          },
        },
      },
    });
  }

  const enhancedParticipants = participants.map((participant) => {
    let avatar = participant.avatar;
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
    for (const field in participant.profileVisibility) {
      if (
        participant.profileVisibility[
          field as keyof typeof participant.profileVisibility
        ] === false
      ) {
        participant[field as keyof typeof participant.profileVisibility] = null;
      }
    }

    return {
      id: participant.id,
      username: participant.username,
      academicTitle: participant.academicTitle,
      firstName: participant.firstName,
      lastName: participant.lastName,
      position: participant.position,
      avatar,
      blurredAvatar,
    };
  });

  return { submission: submission.reply(), participants: enhancedParticipants };
}
