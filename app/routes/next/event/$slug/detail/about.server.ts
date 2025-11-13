import { parseWithZod } from "@conform-to/zod-v1";
import { Prisma, type Profile } from "@prisma/client";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { filterProfileByVisibility } from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import {
  getSearchResponsibleOrganizationsSchema,
  getSearchSpeakersSchema,
  getSearchTeamMembersSchema,
  SEARCH_RESPONSIBLE_ORGANIZATIONS_SEARCH_PARAM,
  SEARCH_SPEAKERS_SEARCH_PARAM,
  SEARCH_TEAM_MEMBERS_SEARCH_PARAM,
} from "./about.shared";
import { filterEventConferenceLink } from "../utils.server";
import { deriveModeForEvent, getIsMember } from "../detail.server";
import { utcToZonedTime } from "date-fns-tz";

export async function getEventBySlug(options: {
  slug: string;
  authClient: SupabaseClient;
  sessionUser: User | null;
  searchParams: URLSearchParams;
  locales: {
    eventNotFound: string;
  };
}) {
  const { slug, authClient, sessionUser, searchParams, locales } = options;

  const teamMembersSubmission = parseWithZod(searchParams, {
    schema: getSearchTeamMembersSchema(),
  });

  const responsibleOrganizationsSubmission = parseWithZod(searchParams, {
    schema: getSearchResponsibleOrganizationsSchema(),
  });

  let teamMembersWhere;
  let responsibleOrganizationsWhere;

  if (
    teamMembersSubmission.status === "success" &&
    typeof teamMembersSubmission.value[SEARCH_TEAM_MEMBERS_SEARCH_PARAM] !==
      "undefined"
  ) {
    const query =
      teamMembersSubmission.value[
        SEARCH_TEAM_MEMBERS_SEARCH_PARAM
      ].trim().split(" ");
    teamMembersWhere = {
      profile: {
        OR: query.map((term) => {
          return {
            OR: [
              { firstName: { contains: term, mode: "insensitive" as const } },
              { lastName: { contains: term, mode: "insensitive" as const } },
              { username: { contains: term, mode: "insensitive" as const } },
            ],
          };
        }),
      },
    };
  }

  if (
    responsibleOrganizationsSubmission.status === "success" &&
    typeof responsibleOrganizationsSubmission.value[
      SEARCH_RESPONSIBLE_ORGANIZATIONS_SEARCH_PARAM
    ] !== "undefined"
  ) {
    const query =
      responsibleOrganizationsSubmission.value[
        SEARCH_RESPONSIBLE_ORGANIZATIONS_SEARCH_PARAM
      ].trim().split(" ");
    responsibleOrganizationsWhere = {
      organization: {
        OR: query.map((term) => {
          return {
            OR: [
              { name: { contains: term, mode: "insensitive" as const } },
              { slug: { contains: term, mode: "insensitive" as const } },
            ],
          };
        }),
      },
    };
  }

  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
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
      conferenceLink: true,
      conferenceCode: true,
      startTime: true,
      endTime: true,
      participationFrom: true,
      participationUntil: true,
      participantLimit: true,
      canceled: true,
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
      teamMembers: {
        where: teamMembersWhere,
        select: {
          profile: {
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
          },
        },
      },
      responsibleOrganizations: {
        where: responsibleOrganizationsWhere,
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
              networkTypes: {
                select: {
                  networkType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      documents: {
        select: {
          document: {
            select: {
              id: true,
              filename: true,
              sizeInMB: true,
              title: true,
              credits: true,
              mimeType: true,
              path: true,
            },
          },
        },
      },
      stage: {
        select: {
          slug: true,
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  invariantResponse(event, locales.eventNotFound, { status: 404 });

  const now = utcToZonedTime(new Date(), "Europe/Berlin");
  const endTime = utcToZonedTime(event.endTime, "Europe/Berlin");
  const participationFrom = utcToZonedTime(
    event.participationFrom,
    "Europe/Berlin"
  );
  const participationUntil = utcToZonedTime(
    event.participationUntil,
    "Europe/Berlin"
  );

  const beforeParticipationPeriod = now < participationFrom;
  const afterParticipationPeriod = now > participationUntil;
  const inPast = now > endTime;

  const mode = await deriveModeForEvent(sessionUser, {
    ...event,
    participantCount: event._count.participants,
    beforeParticipationPeriod,
    afterParticipationPeriod,
    inPast,
  });

  const isMember = await getIsMember(sessionUser, event);
  const { conferenceLink, conferenceCode, conferenceLinkToBeAnnounced } =
    await filterEventConferenceLink({
      event,
      mode,
      isMember,
      inPast,
    });

  const teamMembers = event.teamMembers.map((relation) => {
    let filteredProfile;
    if (sessionUser === null) {
      filteredProfile = filterProfileByVisibility<typeof relation.profile>(
        relation.profile
      );
    } else {
      filteredProfile = relation.profile;
    }
    let avatar = filteredProfile.avatar;
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
      ...filteredProfile,
      avatar,
      blurredAvatar,
    };
  });

  const responsibleOrganizations = event.responsibleOrganizations.map(
    (relation) => {
      let logo = relation.organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItem.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItem.BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return {
        ...relation.organization,
        logo,
        blurredLogo,
      };
    }
  );

  let documents = event.documents;
  if (sessionUser === null) {
    documents = [];
  }

  return {
    teamMembersSubmission: teamMembersSubmission.reply(),
    responsibleOrganizationsSubmission:
      responsibleOrganizationsSubmission.reply(),
    event: {
      ...event,
      documents,
      teamMembers,
      responsibleOrganizations,
      conferenceLink,
      conferenceCode,
      conferenceLinkToBeAnnounced,
    },
  };
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
  const { slug, authClient, sessionUser, searchParams, optionalWhereClause } =
    options;

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
    // Apply profile visibility settings
    let filteredSpeaker;
    if (sessionUser === null) {
      filteredSpeaker = filterProfileByVisibility<typeof speaker>(speaker);
    } else {
      filteredSpeaker = { ...speaker };
    }

    let avatar = filteredSpeaker.avatar;
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

    return { ...filteredSpeaker, avatar, blurredAvatar };
  });

  return { speakersSubmission: submission.reply(), speakers: enhancedSpeakers };
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
