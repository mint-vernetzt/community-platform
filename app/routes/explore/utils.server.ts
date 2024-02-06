import type { Organization, Profile } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { json } from "@remix-run/server-runtime";
import type { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { GravityType, getImageURL } from "~/images.server";
import { type ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma.server";
import { filterOrganizationByVisibility } from "~/public-fields-filtering.server";
import { filterEventByVisibility } from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";

export async function getAllProfiles(
  options: {
    skip: number | undefined;
    take: number | undefined;
    areaId: string | undefined;
    offerId: string | undefined;
    seekingId: string | undefined;
    randomSeed: number | undefined;
  } = {
    skip: undefined,
    take: undefined,
    areaId: undefined,
    offerId: undefined,
    seekingId: undefined,
    randomSeed: 0,
  }
) {
  const { skip, take, areaId, offerId, seekingId, randomSeed } = options;

  let areaToFilter;
  const whereClauses = [];
  let whereClause = Prisma.empty;
  const offerJoin = Prisma.sql`
    LEFT JOIN offers_on_profiles
    ON profiles.id = offers_on_profiles."profileId"
    LEFT JOIN offer O
    ON offers_on_profiles."offerId" = O.id`;
  let seekingJoin = Prisma.empty;
  // Default Ordering with no filter: Deterministic random ordering with seed
  // Set seed for deterministic random order
  await prismaClient.$queryRaw`SELECT CAST(SETSEED(${randomSeed}::double precision) AS TEXT);`;
  let orderByClause = Prisma.sql`ORDER BY "score" DESC, RANDOM()`;
  if (areaId !== undefined) {
    areaToFilter = await getAreaById(areaId);
    if (areaToFilter !== null) {
      let areaWhere;
      if (areaToFilter.type === "global") {
        /* No WHERE statement needed as we want to select all profiles that have at least one area */
        /* ORDER BY: global -> country -> state -> district */
        orderByClause = Prisma.sql`
                        ORDER BY (
                          CASE 
                            WHEN 'global' = ANY (array_agg(DISTINCT areas.type)) THEN 1 
                            WHEN 'country' = ANY (array_agg(DISTINCT areas.type)) THEN 2 
                            WHEN 'state' = ANY (array_agg(DISTINCT areas.type)) THEN 3 
                            WHEN 'district' = ANY (array_agg(DISTINCT areas.type)) THEN 4 
                            ELSE 5 
                          END
                        ) ASC,
                        "score" DESC,
                        RANDOM()`;
      }
      if (areaToFilter.type === "country") {
        /* No WHERE statement needed as we want to select all profiles that have at least one area */
        /* ORDER BY: country -> state -> district */
        orderByClause = Prisma.sql`
                        ORDER BY (
                          CASE 
                            WHEN 'country' = ANY (array_agg(DISTINCT areas.type)) THEN 1 
                            WHEN 'state' = ANY (array_agg(DISTINCT areas.type)) THEN 2 
                            WHEN 'district' = ANY (array_agg(DISTINCT areas.type)) THEN 3 
                            ELSE 4 
                          END
                        ) ASC,
                        "score" DESC,
                        RANDOM()`;
      }
      if (areaToFilter.type === "state") {
        /* Filter profiles that have the exact state as area or districts inside that state as area or an area of the type country */
        if (areaToFilter.stateId !== null) {
          areaWhere = Prisma.sql`"stateId" = ${areaToFilter.stateId} OR type = 'country'`;
        } else {
          areaWhere = Prisma.sql`areas.id = ${areaToFilter.id} OR type = 'country'`;
        }
        /* ORDER BY: state -> district -> country */
        orderByClause = Prisma.sql`
                        ORDER BY (
                          CASE 
                            WHEN 'state' = ANY (array_agg(DISTINCT areas.type)) THEN 1 
                            WHEN 'district' = ANY (array_agg(DISTINCT areas.type)) THEN 2 
                            WHEN 'country' = ANY (array_agg(DISTINCT areas.type)) THEN 3 
                            ELSE 4 
                          END
                        ) ASC, 
                        "score" DESC,
                        RANDOM()`;
      }
      if (areaToFilter.type === "district") {
        /* Filter profiles that have the exact district as area or the state where the district is part of or an area of the type country */
        if (areaToFilter.stateId !== null) {
          areaWhere = Prisma.sql`areas.id = ${areaToFilter.id} OR (type = 'state' AND "stateId" = ${areaToFilter.stateId}) OR type = 'country'`;
        } else {
          areaWhere = Prisma.sql`areas.id = ${areaToFilter.id} OR type = 'state' OR type = 'country'`;
        }
        /* ORDER BY: district -> state -> country */
        orderByClause = Prisma.sql`
                        ORDER BY (
                          CASE 
                            WHEN 'district' = ANY (array_agg(DISTINCT areas.type)) THEN 1 
                            WHEN 'state' = ANY (array_agg(DISTINCT areas.type)) THEN 2 
                            WHEN 'country' = ANY (array_agg(DISTINCT areas.type)) THEN 3 
                            ELSE 4 
                          END
                        ) ASC, 
                        "score" DESC,
                        RANDOM()`;
      }
      if (areaWhere !== undefined) {
        whereClauses.push(areaWhere);
      }
    } else {
      throw json({ message: "Area to filter not found" }, { status: 404 });
    }
  }
  if (offerId !== undefined) {
    /* Filter profiles that have the exact offer */
    const offerWhere = Prisma.sql`O.id = ${offerId}`;
    whereClauses.push(offerWhere);
  }
  if (seekingId !== undefined) {
    seekingJoin = Prisma.sql`
                  LEFT JOIN seekings_on_profiles
                  ON profiles.id = seekings_on_profiles."profileId"
                  LEFT JOIN offer S
                  ON seekings_on_profiles."offerId" = S.id`;
    /* Filter profiles that have the exact seeking */
    const seekingWhere = Prisma.sql`S.id = ${seekingId}`;
    whereClauses.push(seekingWhere);
  }
  if (whereClauses.length > 0) {
    /* All WHERE clauses must hold true and are therefore connected with an logical AND */
    whereClause = Prisma.join(whereClauses, ") AND (", "WHERE (", ")");
  }

  const profiles: Array<
    Pick<
      Profile,
      | "id"
      | "academicTitle"
      | "firstName"
      | "lastName"
      | "username"
      | "bio"
      | "avatar"
      | "background"
      | "position"
      | "score"
      | "updatedAt"
    > & { areas: string[]; offers: string[] }
  > = await prismaClient.$queryRaw`
    SELECT 
      profiles.id,
      profiles.first_name as "firstName",
      profiles.last_name as "lastName",
      profiles.username,
      profiles.academic_title as "academicTitle",
      profiles.position,
      profiles.bio,
      profiles.avatar,
      profiles.background,
      profiles.score,
      profiles.updated_at as "updatedAt",
      array_remove(array_agg(DISTINCT areas.name), null) as "areas",
      array_remove(array_agg(DISTINCT O.title), null) as "offers"
    FROM profiles
      /* Always joining areas to get areaNames */
      LEFT JOIN areas_on_profiles
      ON profiles.id = areas_on_profiles."profileId"
      LEFT JOIN areas
      ON areas_on_profiles."areaId" = areas.id
      ${offerJoin}
      ${seekingJoin}
    /* Filtering with the where clauses from above if any exist */
    ${whereClause}
    GROUP BY profiles.id
    ${orderByClause}
    LIMIT ${take}
    OFFSET ${skip}
  ;`;

  return profiles;
}

export async function getAllOrganizations(
  options: {
    skip: number | undefined;
    take: number | undefined;
    randomSeed: number | undefined;
  } = {
    skip: undefined,
    take: undefined,
    randomSeed: 0,
  }
) {
  const { skip, take, randomSeed } = options;

  // Set seed for deterministic random order
  await prismaClient.$queryRaw`SELECT CAST(SETSEED(${randomSeed}::double precision) AS TEXT);`;

  const organizations: Array<
    Pick<
      Organization,
      | "id"
      | "publicFields"
      | "name"
      | "slug"
      | "bio"
      | "logo"
      | "score"
      | "background"
    > & { areas: string[]; types: string[]; focuses: string[] }
  > = await prismaClient.$queryRaw`
  SELECT 
    organizations.id,
    organizations.name,
    organizations.slug,
    organizations.bio,
    organizations.logo,
    organizations.score,
    organizations.background,
    array_remove(array_agg(DISTINCT areas.name), null) as "areas",
    array_remove(array_agg(DISTINCT organization_types.title), null) as "types",
    array_remove(array_agg(DISTINCT focuses.title), null) as "focuses"
  FROM organizations
    /* Always joining areas and organization_types to get area names and organizationType titles */
    LEFT JOIN areas_on_organizations
    ON organizations.id = areas_on_organizations."organizationId"
    LEFT JOIN areas
    ON areas_on_organizations."areaId" = areas.id
    LEFT JOIN organization_types_on_organizations
    ON organizations.id = organization_types_on_organizations."organizationId"
    LEFT JOIN organization_types
    ON organization_types_on_organizations."organizationTypeId" = organization_types.id
    LEFT JOIN focuses_on_organizations
    ON organizations.id = focuses_on_organizations."organizationId"
    LEFT JOIN focuses
    ON focuses_on_organizations."focusId" = focuses.id
  GROUP BY organizations.id
  ORDER BY "score" DESC, RANDOM()
  LIMIT ${take}
  OFFSET ${skip}
;`;

  return organizations;
}

export async function getAllProjects(
  skip: number | undefined = undefined,
  take: number | undefined = undefined
) {
  const projects = await prismaClient.project.findMany({
    skip,
    take,
    where: {
      published: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      background: true,
      excerpt: true,
      subline: true,
      awards: {
        select: {
          award: {
            select: {
              id: true,
              title: true,
              shortTitle: true,
              date: true,
              logo: true,
            },
          },
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      },
    },
  });

  return projects;
}

export function getPaginationValues(
  request: Request,
  options?: { itemsPerPage?: number; param?: string }
) {
  const { itemsPerPage = 12, param = "page" } = options || {};

  const url = new URL(request.url);
  const pageParam = url.searchParams.get(param) || "1";

  let page = parseInt(pageParam);
  if (Number.isNaN(page) || page < 1) {
    page = 1;
  }

  const skip = itemsPerPage * (page - 1);
  const take = itemsPerPage;

  return { skip, take, page, itemsPerPage };
}

export function getFilterValues(request: Request) {
  const url = new URL(request.url);
  const areaId = url.searchParams.get("areaId") || undefined;
  const offerId = url.searchParams.get("offerId") || undefined;
  const seekingId = url.searchParams.get("seekingId") || undefined;
  return { areaId, offerId, seekingId };
}

export function getRandomSeed(request: Request) {
  const url = new URL(request.url);
  const randomSeedQueryString = url.searchParams.get("randomSeed") || undefined;
  if (randomSeedQueryString !== undefined) {
    return parseFloat(randomSeedQueryString);
  } else {
    return randomSeedQueryString;
  }
}

export async function getEvents(
  inFuture: boolean,
  skip: number | undefined = undefined,
  take: number | undefined = undefined
) {
  const result = await prismaClient.event.findMany({
    where: {
      endTime: inFuture
        ? {
            gte: new Date(),
          }
        : { lte: new Date() },
      published: true,
      OR: [
        {
          parentEventId: null,
          childEvents: {
            none: {},
          },
        },
        {
          childEvents: {
            some: {},
          },
        },
      ],
    },
    skip,
    take,
    select: {
      id: true,
      name: true,
      slug: true,
      parentEventId: true,
      startTime: true,
      endTime: true,
      participationUntil: true,
      participationFrom: true,
      participantLimit: true,
      background: true,
      published: true,
      stage: {
        select: {
          title: true,
          slug: true,
        },
      },
      canceled: true,
      subline: true,
      description: true,
      _count: {
        select: {
          childEvents: true,
          participants: true,
          responsibleOrganizations: true,
          waitingList: true,
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              organizationVisibility: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logo: true,
                },
              },
            },
          },
        },
      },
      eventVisibility: {
        select: {
          id: true,
          name: true,
          slug: true,
          parentEventId: true,
          startTime: true,
          endTime: true,
          participationUntil: true,
          participationFrom: true,
          participantLimit: true,
          background: true,
          published: true,
          stage: true,
          canceled: true,
          subline: true,
          description: true,
          responsibleOrganizations: true,
        },
      },
    },
    orderBy: inFuture
      ? {
          startTime: "asc",
        }
      : { startTime: "desc" },
  });
  return result;
}

export async function enhanceEventsWithParticipationStatus(
  sessionUser: User | null,
  events: Array<
    ArrayElement<Awaited<ReturnType<typeof getEvents>>> & {
      blurredBackground: string | undefined;
    }
  >
) {
  if (sessionUser === null) {
    const enhancedEvents = events.map((item) => {
      const isParticipant = false;
      const isOnWaitingList = false;
      const isSpeaker = false;
      const isTeamMember = false;

      return {
        ...item,
        isParticipant,
        isOnWaitingList,
        isSpeaker,
        isTeamMember,
      };
    });
    return enhancedEvents;
  } else {
    const eventIdsWhereParticipant = (
      await prismaClient.participantOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereOnWaitingList = (
      await prismaClient.waitingParticipantOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereSpeaker = (
      await prismaClient.speakerOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereTeamMember = (
      await prismaClient.teamMemberOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);

    const enhancedEvents = events.map((item) => {
      const isParticipant = eventIdsWhereParticipant.includes(item.id);
      const isOnWaitingList = eventIdsWhereOnWaitingList.includes(item.id);
      const isSpeaker = eventIdsWhereSpeaker.includes(item.id);
      const isTeamMember = eventIdsWhereTeamMember.includes(item.id);

      return {
        ...item,
        isParticipant,
        isOnWaitingList,
        isSpeaker,
        isTeamMember,
      };
    });
    return enhancedEvents;
  }
}

export async function prepareEvents(
  authClient: SupabaseClient,
  sessionUser: User | null,
  inFuture: boolean,
  options: {
    skip: number | undefined;
    take: number | undefined;
  } = { skip: undefined, take: undefined }
) {
  const events = await getEvents(inFuture, options.skip, options.take);

  const enhancedEvents = [];

  for (const event of events) {
    let enhancedEvent = {
      ...event,
    };

    // Filtering by visbility settings
    if (sessionUser === null) {
      // Filter event
      enhancedEvent = await filterEventByVisibility<typeof enhancedEvent>(
        enhancedEvent
      );
      // Filter responsible Organizations
      enhancedEvent.responsibleOrganizations = await Promise.all(
        enhancedEvent.responsibleOrganizations.map(async (relation) => {
          const filteredOrganization = await filterOrganizationByVisibility<
            typeof relation.organization
          >(relation.organization);
          return { ...relation, organization: filteredOrganization };
        })
      );
    }

    // Add images from image proxy
    let blurredBackground;
    if (enhancedEvent.background !== null) {
      const publicURL = getPublicURL(authClient, enhancedEvent.background);
      if (publicURL) {
        enhancedEvent.background = getImageURL(publicURL, {
          resize: { type: "fill", width: 594, height: 396 },
        });
      }
      blurredBackground = getImageURL(publicURL, {
        resize: { type: "fill", width: 18, height: 12 },
        blur: 5,
      });
    } else {
      enhancedEvent.background = "/images/default-event-background.jpg";
      blurredBackground = "/images/default-event-background-blurred.jpg";
    }

    enhancedEvent.responsibleOrganizations =
      enhancedEvent.responsibleOrganizations.map((relation) => {
        let logo = relation.organization.logo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL) {
            logo = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        return {
          ...relation,
          organization: { ...relation.organization, logo },
        };
      });

    const imageEnhancedEvent = {
      ...enhancedEvent,
      blurredBackground,
    };

    enhancedEvents.push(imageEnhancedEvent);
  }

  const enhancedEventsWithParticipationStatus =
    await enhanceEventsWithParticipationStatus(sessionUser, enhancedEvents);

  return enhancedEventsWithParticipationStatus;
}

export async function getAreaById(areaId: string) {
  return await prismaClient.area.findUnique({
    where: {
      id: areaId,
    },
    select: {
      id: true,
      type: true,
      stateId: true,
    },
  });
}
