import { parseWithZod } from "@conform-to/zod-v1";
import { Prisma, type Profile } from "@prisma/client";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import {
  getSearchSpeakersSchema,
  SEARCH_SPEAKERS_SEARCH_PARAM,
} from "./about.shared";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { filterProfileByVisibility } from "~/next-public-fields-filtering.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      types: {
        select: {
          eventType: {
            select: {
              slug: true,
            },
          },
        },
      },
      subline: true,
      description: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      venueCity: true,
      eventTargetGroups: {
        select: {
          eventTargetGroup: {
            select: {
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
      experienceLevel: {
        select: {
          slug: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  return event;
}

export async function getSpeakersOfEvent(options: {
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
  const { slug, authClient, searchParams, optionalWhereClause } = options;

  const submission = parseWithZod(searchParams, {
    schema: getSearchSpeakersSchema(),
  });

  let speakers = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_SPEAKERS_SEARCH_PARAM] === "undefined"
  ) {
    speakers = await prismaClient.profile.findMany({
      where:
        typeof optionalWhereClause !== "undefined"
          ? optionalWhereClause
          : {
              contributedEvents: { some: { event: { slug } } },
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
      submission.value[SEARCH_SPEAKERS_SEARCH_PARAM].trim().split(" ");

    speakers = await prismaClient.profile.findMany({
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
              contributedEvents: { some: { event: { slug } } },
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

  const enhancedSpeakers = speakers.map((speaker) => {
    let avatar = speaker.avatar;
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
    let filteredSpeaker;
    if (options.sessionUser === null) {
      filteredSpeaker = filterProfileByVisibility<typeof speaker>(speaker);
    } else {
      filteredSpeaker = {
        ...speaker,
        avatar,
        blurredAvatar,
      };
    }

    return filteredSpeaker;
  });

  return { submission: submission.reply(), speakers: enhancedSpeakers };
}

export async function getFullDepthSpeakerIds(slug: string) {
  try {
    // Get event and all child events of arbitrary depth with raw query
    // Join the result with relevant relation tables
    const select = Prisma.sql`SELECT profiles.id`;

    const profileJoin = Prisma.sql`JOIN "speakers_of_events"
                    ON get_full_depth.id = "speakers_of_events".event_id
                    JOIN "profiles"
                    ON "profiles".id = "speakers_of_events".profile_id`;

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
