import { Event, Prisma } from "@prisma/client";
import { getRootEvent } from "~/event.server";
import { prismaClient } from "~/prisma";
import { ArrayElement } from "../utils/types";

const eventRelations = Prisma.validator<Prisma.EventArgs>()({
  select: {
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
    _count: {
      select: {
        participants: true,
        childEvents: true,
      },
    },
  },
});

export type EventWithRelations = Prisma.EventGetPayload<typeof eventRelations> &
  Event;

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

export async function addUserParticipationStatus<
  EventsType extends {
    event: Pick<Event, "id">;
  }[]
>(events: EventsType, userId?: string) {
  const result = await Promise.all(
    events.map(async (item) => {
      return {
        event: {
          ...item.event,
          isParticipant: await getIsParticipant(item.event.id, userId),
          isOnWaitingList: await getIsOnWaitingList(item.event.id, userId),
          isTeamMember: await getIsTeamMember(item.event.id, userId),
          isSpeaker: await getIsSpeaker(item.event.id, userId),
        },
      };
    })
  );
  return result as Array<
    ArrayElement<EventsType> & ArrayElement<typeof result>
  >;
}

function reachedParticipateDeadline(event: Pick<Event, "participationUntil">) {
  const participationUntil = new Date(event.participationUntil).getTime();
  return Date.now() > participationUntil;
}

function reachedParticipantLimit(
  participantCount: number,
  participantLimit: number | null
) {
  if (participantLimit === null) {
    return false;
  }
  return participantCount >= participantLimit;
}
// TODO: To much abstraction
function hasChildEvents(childrenCount: number) {
  return childrenCount > 0;
}
// TODO: To much abstraction
function isPublished(event: Pick<Event, "published">) {
  return event.published;
}
// TODO: To much abstraction
function isCanceled(event: Pick<Event, "canceled">) {
  return event.canceled;
}

export function canUserParticipate(
  event: Pick<
    EventWithRelations,
    | "participationUntil"
    | "participantLimit"
    | "published"
    | "canceled"
    | "_count"
  > & {
    isParticipant: boolean;
    isOnWaitingList: boolean;
    isTeamMember: boolean;
    isSpeaker: boolean;
  }
) {
  return (
    !event.isParticipant &&
    !event.isOnWaitingList &&
    !event.isTeamMember &&
    !event.isSpeaker &&
    !reachedParticipateDeadline(event) &&
    !reachedParticipantLimit(
      event._count.participants,
      event.participantLimit
    ) &&
    !hasChildEvents(event._count.childEvents) &&
    isPublished(event) &&
    !isCanceled(event)
  );
}

export function canUserBeAddedToWaitingList(
  event: Pick<
    EventWithRelations,
    | "participationUntil"
    | "participantLimit"
    | "published"
    | "canceled"
    | "_count"
  > & {
    isParticipant: boolean;
    isOnWaitingList: boolean;
    isTeamMember: boolean;
    isSpeaker: boolean;
  }
) {
  return (
    !event.isOnWaitingList &&
    !event.isParticipant &&
    !event.isTeamMember &&
    !event.isSpeaker &&
    !reachedParticipateDeadline(event) &&
    reachedParticipantLimit(
      event._count.participants,
      event.participantLimit
    ) &&
    !hasChildEvents(event._count.childEvents) &&
    isPublished(event) &&
    !isCanceled(event)
  );
}

export function conferenceLinkExists(event: Pick<Event, "conferenceLink">) {
  return event.conferenceLink !== null && event.conferenceLink !== "";
}

function conferenceLinkToBeAnnounced(
  event: Pick<EventWithRelations, "conferenceLink" | "stage">
) {
  return (
    !conferenceLinkExists(event) &&
    event.stage !== null &&
    event.stage.slug !== "on-site"
  );
}

export function canUserAccessConferenceLink(
  event: Pick<EventWithRelations, "conferenceLink" | "stage" | "_count">,
  isParticipant: boolean | undefined,
  isSpeaker: boolean | undefined,
  isTeamMember: boolean | undefined
) {
  return (
    (conferenceLinkExists(event) || conferenceLinkToBeAnnounced(event)) &&
    event._count.childEvents === 0 &&
    (isParticipant || isSpeaker || isTeamMember)
  );
}
