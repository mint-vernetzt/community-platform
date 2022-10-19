import { Event, Prisma } from "@prisma/client";
import { getRootEvent } from "~/event.server";
import { ArrayElement } from "../utils/types";

const eventWithRelations = Prisma.validator<Prisma.EventArgs>()({
  include: {
    participants: true,
    speakers: true,
    parentEvent: true,
    childEvents: true,
    focuses: true,
    targetGroups: true,
    experienceLevel: true,
    types: true,
    tags: true,
    responsibleOrganizations: true,
    teamMembers: true,
    waitingList: true,
    areas: true,
    documents: true,
    stage: true,
  },
});

export type EventWithRelations = Prisma.EventGetPayload<
  typeof eventWithRelations
>;

export async function getRootEvents(
  events: {
    event: Pick<Event, "id" | "parentEventId" | "name" | "slug" | "published">;
  }[]
) {
  let publishedRootEvents: {
    event: ArrayElement<NonNullable<Awaited<ReturnType<typeof getRootEvent>>>>;
  }[] = [];
  await Promise.all(
    events.map(async (item) => {
      const result = await getRootEvent(item.event.id);

      if (result !== null && result.length !== 0) {
        const rootItem = {
          event: result[0],
        };
        if (
          !publishedRootEvents.some((item) => {
            return item.event.slug === rootItem.event.slug;
          })
        ) {
          publishedRootEvents.push(rootItem);
        }
      }
    })
  );
  return publishedRootEvents;
}

export function combineEventsSortChronologically<
  EventsType extends { event: Pick<Event, "startTime"> }[],
  EventsToAddType extends { event: Pick<Event, "startTime"> }[]
>(events: EventsType, eventsToAdd: EventsToAddType) {
  return [...events, ...eventsToAdd].sort(function sortEventsChronologically(
    a,
    b
  ) {
    return a.event.startTime >= b.event.startTime ? 1 : -1;
  });
}

export function isUserParticipating<
  EventType extends Pick<EventWithRelations, "participants">
>(event: EventType, userId?: string) {
  return event.participants.some((participant) => {
    return participant.profileId === userId;
  });
}

export function isUserOnWaitingList<
  EventType extends Pick<EventWithRelations, "waitingList">
>(event: EventType, userId?: string) {
  return event.waitingList.some((waitingUser) => {
    return waitingUser.profileId === userId;
  });
}

function isUserTeamMember<
  EventType extends Pick<EventWithRelations, "teamMembers">
>(event: EventType, userId?: string) {
  return event.teamMembers.some((member) => {
    return member.profileId === userId;
  });
}

function isUserSpeaker<EventType extends Pick<EventWithRelations, "speakers">>(
  event: EventType,
  userId?: string
) {
  return event.speakers.some((speaker) => {
    return speaker.profileId === userId;
  });
}

export function addUserParticipationStatus<
  EventsType extends {
    event: Pick<
      EventWithRelations,
      "participants" | "waitingList" | "speakers" | "teamMembers"
    >;
  }[]
>(events: EventsType, userId?: string) {
  const result = events.map((item) => {
    return {
      event: {
        ...item.event,
        isUserParticipating: isUserParticipating<typeof item.event>(
          item.event,
          userId
        ),
        isUserOnWaitingList: isUserOnWaitingList<typeof item.event>(
          item.event,
          userId
        ),
        isUserTeamMember: isUserTeamMember<typeof item.event>(
          item.event,
          userId
        ),
        isUserSpeaker: isUserSpeaker<typeof item.event>(item.event, userId),
      },
    };
  });
  return result;
}

function reachedParticipateDeadline(event: Pick<Event, "participationUntil">) {
  const participationUntil = new Date(event.participationUntil).getTime();
  return Date.now() > participationUntil;
}

function reachedParticipantLimit(
  event: Pick<EventWithRelations, "participants" | "participantLimit">
) {
  if (event.participantLimit === null) {
    return false;
  }
  return event.participants.length >= event.participantLimit;
}

function hasChildEvents(event: Pick<EventWithRelations, "childEvents">) {
  return event.childEvents.length > 0;
}

function isPublished(event: Pick<Event, "published">) {
  return event.published;
}

function isCanceled(event: Pick<Event, "canceled">) {
  return event.canceled;
}

export function canUserParticipate(
  event: Pick<
    EventWithRelations,
    | "participants"
    | "waitingList"
    | "teamMembers"
    | "speakers"
    | "participationUntil"
    | "participantLimit"
    | "childEvents"
    | "published"
    | "canceled"
  > & {
    isUserParticipating: boolean;
    isUserOnWaitingList: boolean;
    isUserTeamMember: boolean;
    isUserSpeaker: boolean;
  }
) {
  return (
    !event.isUserParticipating &&
    !event.isUserOnWaitingList &&
    !event.isUserTeamMember &&
    !event.isUserSpeaker &&
    !reachedParticipateDeadline(event) &&
    !reachedParticipantLimit(event) &&
    !hasChildEvents(event) &&
    isPublished(event) &&
    !isCanceled(event)
  );
}

export function canUserBeAddedToWaitingList(
  event: Pick<
    EventWithRelations,
    | "participants"
    | "waitingList"
    | "teamMembers"
    | "speakers"
    | "participationUntil"
    | "participantLimit"
    | "childEvents"
    | "published"
    | "canceled"
  > & {
    isUserParticipating: boolean;
    isUserOnWaitingList: boolean;
    isUserTeamMember: boolean;
    isUserSpeaker: boolean;
  }
) {
  return (
    !event.isUserOnWaitingList &&
    !event.isUserParticipating &&
    !event.isUserTeamMember &&
    !event.isUserSpeaker &&
    !reachedParticipateDeadline(event) &&
    reachedParticipantLimit(event) &&
    !hasChildEvents(event) &&
    isPublished(event) &&
    !isCanceled(event)
  );
}
