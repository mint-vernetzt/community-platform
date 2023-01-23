import type { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma";
import { getAreaById } from "~/profile.server";
import { getPublicURL } from "~/storage.server";

export async function getAllProfiles(
  options: {
    skip: number | undefined;
    take: number | undefined;
    areaId: string | undefined;
    offerId: string | undefined;
    seekingId: string | undefined;
  } = {
    skip: undefined,
    take: undefined,
    areaId: undefined,
    offerId: undefined,
    seekingId: undefined,
  }
) {
  const {
    skip,
    take,
    areaId = "a2788c07-8dde-4c5c-9393-d75814935354",
    offerId,
    seekingId,
  } = options;

  const areaToFilter = await getAreaById(areaId);

  const profiles = await prismaClient.$queryRaw`
    SELECT DISTINCT ON (profiles.id) profiles.first_name as "firstName", profiles.last_name as "lastName", profiles.username, profiles.academic_title as "academicTitle", profiles.position, profiles.bio, profiles.avatar, areas.name as "areaName", profiles.public_fields as "publicFields"/*, S."title" as seekingTitle, O."title" as offerTitle*/ /* Insert additional selects when offer and seekings should be selected too */
      FROM profiles
        FULL JOIN areas_on_profiles
        ON profiles.id = areas_on_profiles."profileId"
        FULL JOIN areas
        ON areas.id = areas_on_profiles."areaId"
        FULL JOIN seekings_on_profiles
        ON profiles.id = seekings_on_profiles."profileId"
        FULL JOIN offer S
        ON S.id = seekings_on_profiles."offerId"
        FULL JOIN offers_on_profiles
        ON profiles.id = offers_on_profiles."profileId"
        FULL JOIN offer O
        ON O.id = offers_on_profiles."offerId"
      WHERE "stateId" = ${areaToFilter.stateId} OR type = 'country'
      OFFSET ${skip} LIMIT ${take}
  ;`;

  // const profiles = await prismaClient.profile.findMany({
  //   skip,
  //   take,
  //   include: {
  //     areas: { select: { area: { select: { name: true } } } },
  //     offers: { select: { offer: { select: { title: true } } } },
  //     seekings: { select: { offer: { select: { title: true } } } },
  //   },
  //   orderBy: [{ score: "desc" }, { updatedAt: "asc" }],
  // });

  return profiles;
}

export async function getAllOrganizations(
  skip: number | undefined = undefined,
  take: number | undefined = undefined
) {
  const organizations = await prismaClient.organization.findMany({
    skip,
    take,
    include: {
      areas: { select: { area: { select: { name: true } } } },
      focuses: { select: { focus: { select: { title: true } } } },
      types: { select: { organizationType: { select: { title: true } } } },
    },
    orderBy: [{ score: "desc" }, { updatedAt: "asc" }],
  });

  return organizations;
}

export async function getAllProjects(
  skip: number | undefined = undefined,
  take: number | undefined = undefined
) {
  const projects = await prismaClient.project.findMany({
    skip,
    take,
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      background: true,
      excerpt: true,
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
              name: true,
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
  options = { itemsPerPage: 6 }
) {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page") || "1";

  let page = parseInt(pageParam);
  if (Number.isNaN(page) || page < 1) {
    page = 1;
  }

  const skip = options.itemsPerPage * (page - 1);
  const take = options.itemsPerPage;

  return { skip, take };
}

export function getFilterValues(request: Request) {
  const url = new URL(request.url);
  const areaId = url.searchParams.get("areaId") || undefined;
  const offerId = url.searchParams.get("offerId") || undefined;
  const seekingId = url.searchParams.get("seekingId") || undefined;
  return { areaId, offerId, seekingId };
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
              name: true,
              slug: true,
              logo: true,
            },
          },
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

export type MaybeEnhancedEvents =
  | Awaited<ReturnType<typeof getEvents>>
  | Awaited<ReturnType<typeof enhanceEventsWithParticipationStatus>>;

export async function enhanceEventsWithParticipationStatus(
  currentUserId: string,
  events: Awaited<ReturnType<typeof getEvents>>
) {
  const eventIdsWhereParticipant = (
    await prismaClient.participantOfEvent.findMany({
      where: {
        profileId: currentUserId,
      },
      select: {
        eventId: true,
      },
    })
  ).map((event) => event.eventId);
  const eventIdsWhereOnWaitingList = (
    await prismaClient.waitingParticipantOfEvent.findMany({
      where: {
        profileId: currentUserId,
      },
      select: {
        eventId: true,
      },
    })
  ).map((event) => event.eventId);
  const eventIdsWhereSpeaker = (
    await prismaClient.speakerOfEvent.findMany({
      where: {
        profileId: currentUserId,
      },
      select: {
        eventId: true,
      },
    })
  ).map((event) => event.eventId);
  const eventIdsWhereTeamMember = (
    await prismaClient.teamMemberOfEvent.findMany({
      where: {
        profileId: currentUserId,
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

  let enhancedEvents: MaybeEnhancedEvents = events;

  if (sessionUser !== null) {
    enhancedEvents = await enhanceEventsWithParticipationStatus(
      sessionUser.id,
      events
    );
  }

  enhancedEvents = enhancedEvents.map((item) => {
    if (item.background !== null) {
      const publicURL = getPublicURL(authClient, item.background);
      if (publicURL) {
        item.background = getImageURL(publicURL, {
          resize: { type: "fit", width: 400, height: 280 },
        });
      }
    }
    return item;
  });

  enhancedEvents = enhancedEvents.map((event) => {
    if (event.responsibleOrganizations.length > 0) {
      event.responsibleOrganizations = event.responsibleOrganizations.map(
        (item) => {
          if (item.organization.logo !== null) {
            const publicURL = getPublicURL(authClient, item.organization.logo);
            if (publicURL) {
              item.organization.logo = getImageURL(publicURL, {
                resize: { type: "fit", width: 144, height: 144 },
              });
            }
          }
          return item;
        }
      );
    }
    return event;
  });
  return enhancedEvents as MaybeEnhancedEvents;
}
