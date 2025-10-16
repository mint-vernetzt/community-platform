import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      background: true,
      startTime: true,
      endTime: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      venueCity: true,
      participantLimit: true,
      participationFrom: true,
      participationUntil: true,
      published: true,
      canceled: true,
      stage: {
        select: {
          slug: true,
        },
      },
      parentEvent: {
        select: {
          name: true,
          slug: true,
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
      _count: {
        select: {
          participants: true,
          childEvents: true,
        },
      },
    },
  });

  return event;
}

export async function deriveModeForEvent(
  sessionUser: { id: string } | null,
  eventInfo: {
    id: string;
    beforeParticipationPeriod: boolean;
    afterParticipationPeriod: boolean;
    inPast: boolean;
    participantLimit: number | null;
    participantCount: number;
  }
) {
  if (sessionUser === null) {
    return "anon" as const;
  }

  const adminRelation = await prismaClient.adminOfEvent.findFirst({
    where: {
      profileId: sessionUser.id,
      eventId: eventInfo.id,
    },
  });

  if (adminRelation !== null) {
    return "admin" as const;
  }

  const participantRelation = await prismaClient.participantOfEvent.findFirst({
    where: {
      profileId: sessionUser.id,
      eventId: eventInfo.id,
    },
  });

  if (participantRelation !== null) {
    return "participating" as const;
  }

  const waitingParticipantRelation =
    await prismaClient.waitingParticipantOfEvent.findFirst({
      where: {
        profileId: sessionUser.id,
        eventId: eventInfo.id,
      },
    });

  if (waitingParticipantRelation !== null) {
    return "waiting" as const;
  }

  if (
    eventInfo.inPast ||
    eventInfo.afterParticipationPeriod ||
    eventInfo.beforeParticipationPeriod
  ) {
    return null;
  }

  if (
    eventInfo.participantLimit !== null &&
    eventInfo.participantCount >= eventInfo.participantLimit
  ) {
    return "canWait" as const;
  }

  return "canParticipate" as const;
}

export async function getIsMember(
  sessionUser: { id: string } | null,
  event: { id: string }
) {
  if (sessionUser === null) {
    return false;
  }

  const member = await prismaClient.profile.findFirst({
    where: {
      id: sessionUser.id,
      OR: [
        {
          teamMemberOfEvents: {
            some: {
              eventId: event.id,
            },
          },
          contributedEvents: {
            some: {
              eventId: event.id,
            },
          },
          administeredEvents: {
            some: {
              eventId: event.id,
            },
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });
  return member !== null;
}
