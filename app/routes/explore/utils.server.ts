import { prismaClient } from "~/prisma";

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

export async function getEvents() {
  const result = await prismaClient.event.findMany({
    where: {
      startTime: {
        gte: new Date(),
      },
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
