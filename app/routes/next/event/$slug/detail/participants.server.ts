import { parseWithZod } from "@conform-to/zod-v1";
import { type User, type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import {
  getSearchParticipantsSchema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./participants.shared";
import { filterProfileByVisibility } from "~/next-public-fields-filtering.server";
import { Prisma, type Profile } from "@prisma/client";
import { invariantResponse } from "~/lib/utils/response";

export async function getParticipantsOfEvent(options: {
  slug: string;
  authClient: SupabaseClient;
  sessionUser: User | null;
  searchParams: URLSearchParams;
  optionalWhereClause?: {
    id: {
      in: string[];
    };
  };
}) {
  const { slug, authClient, sessionUser, searchParams, optionalWhereClause } =
    options;

  const submission = parseWithZod(searchParams, {
    schema: getSearchParticipantsSchema(),
  });

  let participants = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM] === "undefined"
  ) {
    participants = await prismaClient.profile.findMany({
      where:
        typeof optionalWhereClause !== "undefined"
          ? optionalWhereClause
          : {
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
  } else {
    const query =
      submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM].trim().split(" ");

    participants = await prismaClient.profile.findMany({
      where:
        typeof optionalWhereClause !== "undefined"
          ? {
              ...optionalWhereClause,
              OR: query.map((term) => {
                return {
                  OR: [
                    { firstName: { contains: term, mode: "insensitive" } },
                    { lastName: { contains: term, mode: "insensitive" } },
                    { username: { contains: term, mode: "insensitive" } },
                  ],
                };
              }),
            }
          : {
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

export async function getFullDepthParticipantIds(slug: string) {
  try {
    // Get event and all child events of arbitrary depth with raw query
    // Join the result with relevant relation tables
    const select = Prisma.sql`SELECT profiles.id`;

    const profileJoin = Prisma.sql`JOIN "participants_of_events"
                    ON get_full_depth.id = "participants_of_events".event_id
                    JOIN "profiles"
                    ON "profiles".id = "participants_of_events".profile_id`;

    const groupByClause = Prisma.sql`GROUP BY profiles.id`;

    const result: Array<Pick<Profile, "id">> = await prismaClient.$queryRaw`
      WITH RECURSIVE get_full_depth AS (
          SELECT id, parent_event_id, name
          FROM "events"
          WHERE slug = ${slug}
        UNION
          SELECT "events".id, "events".parent_event_id, "events".name
          FROM "events"
            JOIN get_full_depth
            ON "events".parent_event_id = get_full_depth.id
      )
        ${select}
        FROM get_full_depth
          ${profileJoin}
        ${groupByClause}
      ;`;

    const profiles = result.map((profile) => {
      return profile.id;
    });
    return profiles;
  } catch (error) {
    console.error({ error });
    invariantResponse(false, "Server Error", { status: 500 });
  }
}
