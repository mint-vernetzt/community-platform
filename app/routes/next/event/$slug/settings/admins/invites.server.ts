import { parseWithZod } from "@conform-to/zod";
import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import {
  createSearchInvitedProfilesSchema,
  INVITED_PROFILES_SEARCH_PARAM,
} from "./invites.shared";

export async function getInvitedProfilesToJoinEventAsAdmin(options: {
  request: Request;
  eventId: string;
  authClient: SupabaseClient;
  locales: {
    validation: {
      min: string;
    };
  };
}) {
  const { request, eventId, authClient, locales } = options;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const submission = parseWithZod(searchParams, {
    schema: createSearchInvitedProfilesSchema(locales),
  });

  let result = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[INVITED_PROFILES_SEARCH_PARAM] === "undefined"
  ) {
    result = await prismaClient.inviteForProfileToJoinEvent.findMany({
      where: {
        eventId,
        role: "admin",
        status: "pending",
      },
      select: {
        profile: {
          select: {
            id: true,
            username: true,
            academicTitle: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        createdAt: true,
      },
    });
  } else {
    const query =
      submission.value[INVITED_PROFILES_SEARCH_PARAM].trim().split(" ");

    result = await prismaClient.inviteForProfileToJoinEvent.findMany({
      where: {
        eventId,
        role: "admin",
        status: "pending",
        profile: {
          OR: query.map((term) => {
            return {
              OR: [
                { firstName: { contains: term, mode: "insensitive" } },
                { lastName: { contains: term, mode: "insensitive" } },
              ],
            };
          }),
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
            avatar: true,
          },
        },
        createdAt: true,
      },
    });
  }

  const profiles = result.map((item) => {
    let avatar = item.profile.avatar;
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
      ...item.profile,
      avatar,
      blurredAvatar,
      invitedAt: item.createdAt,
    };
  });
  return { submission: submission.reply(), profiles };
}

export async function revokeInviteOfProfileToJoinEventAsAdmin(options: {
  eventId: string;
  profileId: string;
}) {
  const { eventId, profileId } = options;

  const invite = await prismaClient.inviteForProfileToJoinEvent.findUnique({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId,
        role: "admin",
      },
      status: "pending",
    },
  });

  if (invite === null) {
    return null;
  }

  const result = await prismaClient.inviteForProfileToJoinEvent.update({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId,
        role: "admin",
      },
    },
    data: {
      status: "canceled",
    },
  });

  return result;
}
