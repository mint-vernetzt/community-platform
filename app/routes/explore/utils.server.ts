import type { Organization, Profile } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { json } from "@remix-run/server-runtime";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { GravityType, getImageURL } from "~/images.server";
import { type ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma.server";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";

export async function getAllProfiles(options: {
  skip: number;
  take: number;
  areaId?: string;
  offerId?: string;
  seekingId?: string;
  sortBy?: string;
}) {
  const {
    skip,
    take,
    areaId,
    offerId,
    seekingId,
    sortBy = "firstNameAsc",
  } = options;

  let areaToFilter;
  const whereStatements = [];
  let whereClause = Prisma.empty;
  const offerJoin = Prisma.sql`
  LEFT JOIN offers_on_profiles
  ON profiles.id = offers_on_profiles."profileId"
  LEFT JOIN offer O
  ON offers_on_profiles."offerId" = O.id`;
  let seekingJoin = Prisma.empty;
  let orderByClause = Prisma.empty;
  if (sortBy === "firstNameDesc") {
    orderByClause = Prisma.sql`ORDER BY "firstName" DESC`;
  } else if (sortBy === "lastNameAsc") {
    orderByClause = Prisma.sql`ORDER BY "lastName" ASC`;
  } else if (sortBy === "lastNameDesc") {
    orderByClause = Prisma.sql`ORDER BY "lastName" DESC`;
  } else if (sortBy === "newest") {
    orderByClause = Prisma.sql`ORDER BY "createdAt" DESC`;
  } else {
    // default
    orderByClause = Prisma.sql`ORDER BY "firstName" ASC`;
  }
  if (areaId !== undefined) {
    areaToFilter = await getAreaById(areaId);
    if (areaToFilter !== null) {
      let areaWhere;
      if (areaToFilter.type === "state") {
        /* Filter profiles that have the exact state as area or districts inside that state as area or an area of the type country */
        if (areaToFilter.stateId !== null) {
          areaWhere = Prisma.sql`"stateId" = ${areaToFilter.stateId} OR type = 'country'`;
        } else {
          areaWhere = Prisma.sql`areas.id = ${areaToFilter.id} OR type = 'country'`;
        }
      }
      if (areaToFilter.type === "district") {
        /* Filter profiles that have the exact district as area or the state where the district is part of or an area of the type country */
        if (areaToFilter.stateId !== null) {
          areaWhere = Prisma.sql`areas.id = ${areaToFilter.id} OR (type = 'state' AND "stateId" = ${areaToFilter.stateId}) OR type = 'country'`;
        } else {
          areaWhere = Prisma.sql`areas.id = ${areaToFilter.id} OR type = 'state' OR type = 'country'`;
        }
      }
      if (areaWhere !== undefined) {
        whereStatements.push(areaWhere);
      }
    } else {
      throw json({ message: "Area to filter not found" }, { status: 404 });
    }
  }
  if (offerId !== undefined) {
    /* Filter profiles that have the exact offer */
    const offerWhere = Prisma.sql`O.id = ${offerId}`;
    whereStatements.push(offerWhere);
  }
  if (seekingId !== undefined) {
    seekingJoin = Prisma.sql`
                  LEFT JOIN seekings_on_profiles
                  ON profiles.id = seekings_on_profiles."profileId"
                  LEFT JOIN offer S
                  ON seekings_on_profiles."offerId" = S.id`;
    /* Filter profiles that have the exact seeking */
    const seekingWhere = Prisma.sql`S.id = ${seekingId}`;
    whereStatements.push(seekingWhere);
  }
  if (whereStatements.length > 0) {
    /* All WHERE clauses must hold true and are therefore connected with an logical AND */
    whereClause = Prisma.join(whereStatements, ") AND (", "WHERE (", ")");
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
      | "createdAt"
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
      profiles.created_at as "createdAt",
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

export async function getAllOrganizations(options: {
  skip: number;
  take: number;
  sortBy?: string;
}) {
  const { skip, take, sortBy = "nameAsc" } = options;

  let orderByClause = Prisma.empty;
  if (sortBy === "nameDesc") {
    orderByClause = Prisma.sql`ORDER BY "name" DESC`;
  } else if (sortBy === "newest") {
    orderByClause = Prisma.sql`ORDER BY "createdAt" DESC`;
  } else {
    // default
    orderByClause = Prisma.sql`ORDER BY "name" ASC`;
  }

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
      | "createdAt"
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
    organizations.created_at as "createdAt",
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
  ${orderByClause}
  LIMIT ${take}
  OFFSET ${skip}
;`;

  return organizations;
}

export async function getAllProjects(options: {
  skip: number;
  take: number;
  sortBy?: string;
}) {
  const { skip, take, sortBy = "nameAsc" } = options;

  let orderBy = {};
  if (sortBy === "nameDesc") {
    orderBy = {
      name: "desc",
    };
  } else if (sortBy === "newest") {
    orderBy = {
      createdAt: "desc",
    };
  } else {
    // default
    orderBy = {
      name: "asc",
    };
  }

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
      projectVisibility: {
        select: {
          id: true,
          slug: true,
          name: true,
          logo: true,
          background: true,
          excerpt: true,
          subline: true,
          awards: true,
          responsibleOrganizations: true,
        },
      },
    },
    orderBy,
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

export function getSortValue(request: Request) {
  const url = new URL(request.url);
  const sortBy = url.searchParams.get("sortBy") || "firstNameAsc";
  return { sortBy };
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

export type PrepareEventsQuery = Awaited<ReturnType<typeof prepareEvents>>;

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
      enhancedEvent =
        filterEventByVisibility<typeof enhancedEvent>(enhancedEvent);
      // Filter responsible Organizations
      enhancedEvent.responsibleOrganizations =
        enhancedEvent.responsibleOrganizations.map((relation) => {
          const filteredOrganization = filterOrganizationByVisibility<
            typeof relation.organization
          >(relation.organization);
          return { ...relation, organization: filteredOrganization };
        });
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
