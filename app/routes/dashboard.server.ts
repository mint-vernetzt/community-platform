import { type User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";

export async function getProfileById(id: string) {
  const profile = await prismaClient.profile.findUnique({
    where: { id },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      termsAccepted: true,
    },
  });

  return profile;
}

export async function getProfilesForCards(take: number) {
  const profiles = await prismaClient.profile.findMany({
    select: {
      academicTitle: true,
      username: true,
      firstName: true,
      lastName: true,
      position: true,
      avatar: true,
      background: true,
      offers: { select: { offer: { select: { title: true } } } },
      areas: { select: { area: { select: { name: true } } } },
      memberOf: {
        select: {
          organization: {
            select: {
              slug: true,
              logo: true,
              name: true,
            },
          },
        },
        orderBy: {
          organization: {
            updatedAt: "asc",
          },
        },
      },
      _count: {
        select: {
          memberOf: true,
        },
      },
    },
    take,
    orderBy: { createdAt: "desc" },
  });

  return profiles;
}

export async function getOrganizationsForCards(take: number) {
  const profiles = await prismaClient.organization.findMany({
    select: {
      slug: true,
      name: true,
      logo: true,
      background: true,
      focuses: { select: { focus: { select: { title: true } } } },
      areas: { select: { area: { select: { name: true } } } },
      types: { select: { organizationType: { select: { title: true } } } },
      teamMembers: {
        select: {
          profile: {
            select: {
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          profile: {
            updatedAt: "asc",
          },
        },
      },
      _count: {
        select: {
          memberOf: true,
        },
      },
    },
    take,
    orderBy: { createdAt: "desc" },
  });

  return profiles;
}

export async function getProjectsForCards(take: number) {
  const projects = await prismaClient.project.findMany({
    select: {
      slug: true,
      name: true,
      logo: true,
      subline: true,
      excerpt: true,
      background: true,
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              slug: true,
              logo: true,
              name: true,
            },
          },
        },
        orderBy: {
          organization: {
            updatedAt: "asc",
          },
        },
      },
    },
    take,
    orderBy: { createdAt: "desc" },
  });

  return projects;
}

export async function getEventsForCards(take: number) {
  const events = await prismaClient.event.findMany({
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
              slug: true,
              name: true,
              logo: true,
            },
          },
        },
      },
    },
    where: {
      published: true,
      endTime: { gte: new Date() },
    },
    take,
    orderBy: { startTime: "asc" },
  });

  return events;
}

export async function enhanceEventsWithParticipationStatus(
  sessionUser: User | null,
  events: Awaited<ReturnType<typeof getEventsForCards>>
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
