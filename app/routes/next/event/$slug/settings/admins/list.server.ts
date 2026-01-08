import { type SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import {
  getSearchAdminsSchema,
  SEARCH_ADMINS_SEARCH_PARAM,
} from "./list.shared";
import { parseWithZod } from "@conform-to/zod";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";

export async function getAdminsOfEvent(options: {
  slug: string;
  authClient: SupabaseClient;
  searchParams: URLSearchParams;
}) {
  const { slug, authClient, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: getSearchAdminsSchema(),
  });

  let admins = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_ADMINS_SEARCH_PARAM] === "undefined"
  ) {
    admins = await prismaClient.profile.findMany({
      where: {
        administeredEvents: { some: { event: { slug } } },
      },
      select: {
        id: true,
        username: true,
        academicTitle: true,
        firstName: true,
        lastName: true,
        avatar: true,
        position: true,
      },
    });
  } else {
    const query =
      submission.value[SEARCH_ADMINS_SEARCH_PARAM].trim().split(" ");

    admins = await prismaClient.profile.findMany({
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
            id: true,
            username: true,
            academicTitle: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true,
          },
        },
      },
    });
  }

  const enhancedAdmins = admins.map((admin) => {
    let avatar = admin.avatar;
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

    return { ...admin, avatar, blurredAvatar };
  });

  return { submission: submission.reply(), admins: enhancedAdmins };
}

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          admins: true,
        },
      },
    },
  });
  return event;
}

export async function removeAdminFromEvent(options: {
  eventId: string;
  adminId: string;
}) {
  const { eventId, adminId } = options;

  const result = await prismaClient.adminOfEvent.delete({
    where: {
      profileId_eventId: {
        eventId: eventId,
        profileId: adminId,
      },
    },
  });

  return result;
}
