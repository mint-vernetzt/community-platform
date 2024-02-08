import type { Event } from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
  getIsOnWaitingList,
  getIsParticipant,
  getIsSpeaker,
  getIsTeamMember,
} from "~/routes/event/$slug/utils.server";
import type { ArrayElement } from "../utils/types";

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

export async function addUserParticipationStatus<
  T extends {
    event: Pick<Event, "id">;
  }[]
>(events: T, userId?: string) {
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
  return result as Array<ArrayElement<T> & ArrayElement<typeof result>>;
}

function reachedParticipateDeadline(event: {
  participationUntil: string;
  participationFrom: string;
}) {
  const participationUntil = new Date(event.participationUntil).getTime();
  const participationFrom = new Date(event.participationFrom).getTime();
  const now = Date.now();
  return now > participationUntil || now < participationFrom;
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

export function canUserParticipate(event: {
  participationFrom: string;
  participationUntil: string;
  participantLimit: number | null;
  published: boolean;
  canceled: boolean;
  _count: {
    participants: number;
  };
  isParticipant: boolean;
  isOnWaitingList: boolean;
  isTeamMember: boolean;
  isSpeaker: boolean;
}) {
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
    event.published &&
    !event.canceled
  );
}

export function canUserBeAddedToWaitingList(event: {
  participationFrom: string;
  participationUntil: string;
  participantLimit: number | null;
  published: boolean;
  canceled: boolean;
  _count: {
    participants: number;
  };
  isParticipant: boolean;
  isOnWaitingList: boolean;
  isTeamMember: boolean;
  isSpeaker: boolean;
}) {
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
    event.published &&
    !event.canceled
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
  isParticipant: boolean,
  isSpeaker: boolean,
  isTeamMember: boolean
) {
  return (
    (conferenceLinkExists(event) || conferenceLinkToBeAnnounced(event)) &&
    (isParticipant || isSpeaker || isTeamMember)
  );
}
