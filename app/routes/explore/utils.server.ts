import { User } from "@supabase/supabase-js";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma";
import { getPublicURL } from "~/storage.server";

export async function getAllProfiles() {
  const profiles = await prismaClient.profile.findMany({
    include: {
      areas: { select: { area: { select: { name: true } } } },
      offers: { select: { offer: { select: { title: true } } } },
      seekings: { select: { offer: { select: { title: true } } } },
    },
  });

  return profiles;
}
export async function getAllOrganizations() {
  const organizations = await prismaClient.organization.findMany({
    include: {
      areas: { select: { area: { select: { name: true } } } },
      focuses: { select: { focus: { select: { title: true } } } },
      types: { select: { organizationType: { select: { title: true } } } },
    },
  });

  return organizations;
}

export function getScoreOfEntity(entity: any) {
  const hasAvatar = entity.avatar !== undefined && entity.avatar !== null;
  const hasLogo = entity.logo !== undefined && entity.logo !== null;
  const hasPosition = entity.position !== undefined && entity.position !== null;
  const hasBio = entity.bio !== undefined && entity.bio !== null;
  const hasSkills = entity.skills !== undefined && entity.skills.length > 0;
  const hasInterests =
    entity.interests !== undefined && entity.interests.length > 0;
  const hasAreas = entity.areas !== undefined && entity.areas.length > 0;
  const hasOffers = entity.offers !== undefined && entity.offers.length > 0;
  const hasSeekings =
    entity.seekings !== undefined && entity.seekings.length > 0;
  const hasFocuses = entity.focuses !== undefined && entity.focuses.length > 0;

  let score = 0;

  if (hasAvatar) {
    score = score + 3;
  }
  if (hasLogo) {
    score = score + 3;
  }
  if (hasPosition) {
    score = score + 2;
  }
  if (hasBio) {
    score = score + 3;
  }
  if (hasSkills) {
    score = score + 1;
  }
  if (hasInterests) {
    score = score + 1;
  }
  if (hasAreas) {
    score = score + 1;
  }
  if (hasOffers) {
    score = score + 3;
  }
  if (hasSeekings) {
    score = score + 3;
  }
  if (hasFocuses) {
    score = score + 1;
  }

  return score;
}

export async function getEvents(inFuture: boolean) {
  const result = await prismaClient.event.findMany({
    where: {
      startTime: inFuture
        ? {
            gte: new Date(),
          }
        : { lte: new Date() },
      published: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      parentEventId: true,
      startTime: true,
      endTime: true,
      participationUntil: true,
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
    orderBy: {
      startTime: "asc",
    },
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
  sessionUser: User | null,
  inFuture: boolean
) {
  const events = await getEvents(inFuture);

  let enhancedEvents: MaybeEnhancedEvents = events;

  if (sessionUser !== null) {
    enhancedEvents = await enhanceEventsWithParticipationStatus(
      sessionUser.id,
      events
    );
  }

  enhancedEvents = enhancedEvents.map((item) => {
    if (item.background !== null) {
      const publicURL = getPublicURL(item.background);
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
            const publicURL = getPublicURL(item.organization.logo);
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
