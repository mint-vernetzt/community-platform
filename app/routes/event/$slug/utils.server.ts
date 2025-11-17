import { stages } from "prisma/scripts/import-datasets/data/stages";
import { prismaClient } from "~/prisma.server";
import { type deriveModeForEvent } from "./detail.server";
import { invariantResponse } from "~/lib/utils/response";
import { Prisma, type Profile } from "@prisma/client";

export function getChildEventCount(slug: string) {
  return prismaClient.event.count({
    where: { parentEvent: { slug } },
  });
}

export async function filterEventConferenceLink(options: {
  event: {
    conferenceLink: string | null;
    conferenceCode: string | null;
    canceled: boolean;
    stage: {
      slug: string;
    } | null;
  };
  mode: Awaited<ReturnType<typeof deriveModeForEvent>>;
  isMember: boolean;
  inPast: boolean;
}) {
  const { event, mode, isMember, inPast } = options;

  const onlineStagesFromDataset = stages
    .filter((stage) => stage.slug === "online" || stage.slug === "hybrid")
    .map((stage) => stage.slug);

  const isOnlineEvent = onlineStagesFromDataset.some(
    (stageSlug) => event.stage !== null && event.stage.slug === stageSlug
  );
  const allowedToSeeConferenceLink =
    (isMember === true ||
      (mode === "participating" &&
        inPast === false &&
        event.canceled === false)) &&
    isOnlineEvent === true;

  let conferenceLink = event.conferenceLink;
  let conferenceCode = event.conferenceCode;
  let conferenceLinkToBeAnnounced = false;

  if (allowedToSeeConferenceLink === true && conferenceLink === null) {
    conferenceLinkToBeAnnounced = true;
  }

  if (allowedToSeeConferenceLink === false) {
    conferenceLink = null;
    conferenceCode = null;
  }
  return { conferenceLink, conferenceCode, conferenceLinkToBeAnnounced };
}

// old
export async function getIsParticipant(eventId: string, profileId?: string) {
  if (profileId === undefined) {
    return false;
  }
  const result = await prismaClient.participantOfEvent.findFirst({
    where: {
      eventId,
      profileId,
    },
  });
  return result !== null;
}

// old
export async function getIsOnWaitingList(eventId: string, profileId?: string) {
  if (profileId === undefined) {
    return false;
  }
  const result = await prismaClient.waitingParticipantOfEvent.findFirst({
    where: {
      eventId,
      profileId,
    },
  });
  return result !== null;
}

// old
export async function getIsSpeaker(eventId: string, profileId?: string) {
  if (profileId === undefined) {
    return false;
  }
  const result = await prismaClient.speakerOfEvent.findFirst({
    where: {
      eventId,
      profileId,
    },
  });
  return result !== null;
}

// old
export async function getIsTeamMember(eventId: string, profileId?: string) {
  if (profileId === undefined) {
    return false;
  }
  const result = await prismaClient.teamMemberOfEvent.findFirst({
    where: {
      eventId,
      profileId,
    },
  });
  return result !== null;
}

// old
export async function getEventVisibilitiesBySlugOrThrow(slug: string) {
  const result = await prismaClient.eventVisibility.findFirst({
    where: {
      event: {
        slug,
      },
    },
  });
  if (result === null) {
    invariantResponse(false, "Event visbilities not found.", { status: 404 });
  }
  return result;
}

// old
export type FullDepthProfilesQuery = Awaited<
  ReturnType<typeof getFullDepthProfiles>
>;

export async function getFullDepthProfiles(
  eventId: string,
  relation: "participants" | "waitingList" | "speakers",
  groupBy: "profiles" | "events" = "profiles"
) {
  try {
    // Get event and all child events of arbitrary depth with raw query
    // Join the result with relevant relation tables
    const select =
      groupBy === "profiles"
        ? Prisma.sql`SELECT 
                  profiles.id, 
                  first_name as "firstName", 
                  last_name as "lastName", 
                  username, 
                  position, 
                  avatar, 
                  academic_title as "academicTitle"`
        : Prisma.sql`SELECT 
                  profiles.id, 
                  first_name as "firstName", 
                  last_name as "lastName", 
                  username, 
                  profiles.email, 
                  position, 
                  avatar, 
                  academic_title as "academicTitle", 
                  get_full_depth.name as "participatedEvents", 
                  array_remove(array_agg(DISTINCT organizations.name), null) as "memberOf",
                  array_remove(array_agg(DISTINCT areas.name), null) as "areas"`;

    const profileJoin =
      relation === "participants"
        ? Prisma.sql`JOIN "participants_of_events"
                    ON get_full_depth.id = "participants_of_events".event_id
                    JOIN "profiles"
                    ON "profiles".id = "participants_of_events".profile_id`
        : relation === "waitingList"
          ? Prisma.sql`JOIN "waiting_participants_of_events"
                    ON get_full_depth.id = "waiting_participants_of_events".event_id
                    JOIN "profiles"
                    ON "profiles".id = "waiting_participants_of_events".profile_id`
          : Prisma.sql`JOIN "speakers_of_events"
                    ON get_full_depth.id = "speakers_of_events".event_id
                    JOIN "profiles"
                    ON "profiles".id = "speakers_of_events".profile_id`;

    const organizationJoin =
      groupBy === "profiles"
        ? Prisma.empty
        : Prisma.sql`LEFT JOIN "members_of_organizations"
                    ON "profiles".id = "members_of_organizations"."profileId"
                    LEFT JOIN "organizations"
                    ON "organizations".id = "members_of_organizations"."organizationId"`;

    const areasJoin =
      groupBy === "profiles"
        ? Prisma.empty
        : Prisma.sql`LEFT JOIN "areas_on_profiles"
                    ON "profiles".id = "areas_on_profiles"."profileId"
                    LEFT JOIN "areas"
                    ON "areas".id = "areas_on_profiles"."areaId"`;

    const groupByClause =
      groupBy === "profiles"
        ? Prisma.sql`GROUP BY profiles.id`
        : Prisma.sql`GROUP BY get_full_depth.name, profiles.id`;

    const result: Array<
      Pick<
        Profile,
        | "id"
        | "academicTitle"
        | "firstName"
        | "lastName"
        | "username"
        | "avatar"
        | "position"
      > & {
        email?: string;
        participatedEvents?: string;
        memberOf?: string[];
        areas?: string[];
      }
    > = await prismaClient.$queryRaw`
      WITH RECURSIVE get_full_depth AS (
          SELECT id, parent_event_id, name
          FROM "events"
          WHERE id = ${eventId}
        UNION
          SELECT "events".id, "events".parent_event_id, "events".name
          FROM "events"
            JOIN get_full_depth
            ON "events".parent_event_id = get_full_depth.id
      )
        ${select}
        FROM get_full_depth
          ${profileJoin}
          ${organizationJoin}
          ${areasJoin}
        ${groupByClause}
        ORDER BY first_name ASC
      ;`;

    const profiles = result.map((profile) => {
      return { profile };
    });
    return profiles;
  } catch (error) {
    console.error({ error });
    invariantResponse(false, "Server Error", { status: 500 });
  }
}
