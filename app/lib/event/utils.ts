import type { Event } from "@prisma/client";
import { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eventRelations = Prisma.validator<Prisma.EventDefaultArgs>()({
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

function reachedParticipateDeadline(event: {
  participationUntil: Date;
  participationFrom: Date;
}) {
  const participationUntil = event.participationUntil.getTime();
  const participationFrom = event.participationFrom.getTime();
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
  participationFrom: Date;
  participationUntil: Date;
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
  participationFrom: Date;
  participationUntil: Date;
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

function conferenceLinkToBeAnnounced(event: {
  conferenceLink: string | null;
  stage: {
    slug: string;
  } | null;
}) {
  return (
    !conferenceLinkExists(event) &&
    event.stage !== null &&
    event.stage.slug !== "on-site"
  );
}

export function canUserAccessConferenceLink(
  event: {
    conferenceLink: string | null;
    stage: {
      slug: string;
    } | null;
  },
  isParticipant: boolean,
  isSpeaker: boolean,
  isTeamMember: boolean
) {
  return (
    (conferenceLinkExists(event) || conferenceLinkToBeAnnounced(event)) &&
    (isParticipant || isSpeaker || isTeamMember)
  );
}
