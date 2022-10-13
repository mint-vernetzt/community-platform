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
    isPublished(event)
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
    isPublished(event)
  );
}

export function isLongerThanOneDay(
  event: Pick<Event, "startTime" | "endTime">
) {
  const oneDayInMillis = 86400000;
  return (
    new Date(event.endTime).getTime() - new Date(event.startTime).getTime() >=
    oneDayInMillis
  );
}

export function createDateLabel(event: Pick<Event, "startTime" | "endTime">) {
  let dateLabel: {
    date: string;
    time?: string;
  } = {
    date: "",
    time: undefined,
  };
  const monthLabels = new Map();
  monthLabels.set(0, {
    full: "Januar",
    abbreviation: "Jan.",
  });
  monthLabels.set(1, {
    full: "Februar",
    abbreviation: "Feb.",
  });
  monthLabels.set(2, {
    full: "März",
    abbreviation: "März",
  });
  monthLabels.set(3, {
    full: "April",
    abbreviation: "Apr.",
  });
  monthLabels.set(4, {
    full: "Mai",
    abbreviation: "Mai",
  });
  monthLabels.set(5, {
    full: "Juni",
    abbreviation: "Juni",
  });
  monthLabels.set(6, {
    full: "Juli",
    abbreviation: "Juli",
  });
  monthLabels.set(7, {
    full: "August",
    abbreviation: "Aug.",
  });
  monthLabels.set(8, {
    full: "September",
    abbreviation: "Sept.",
  });
  monthLabels.set(9, {
    full: "Oktober",
    abbreviation: "Okt.",
  });
  monthLabels.set(10, {
    full: "November",
    abbreviation: "Nov.",
  });
  monthLabels.set(11, {
    full: "Dezember",
    abbreviation: "Dez.",
  });

  let startDate = new Date(event.startTime);
  let endDate = new Date(event.endTime);
  if (isLongerThanOneDay(event)) {
    dateLabel.date = `${startDate.getDate()}. ${
      monthLabels.get(startDate.getMonth()).abbreviation
    } - ${endDate.getDate()}. ${
      monthLabels.get(endDate.getMonth()).abbreviation
    } ${endDate.getFullYear()}`;
  } else {
    dateLabel.date = `${startDate.getDate()}. ${
      monthLabels.get(startDate.getMonth()).full
    } ${startDate.getFullYear()}`;
    if (startDate.getTime() === endDate.getTime()) {
      dateLabel.time = `${
        startDate.getHours() < 10
          ? "0" + startDate.getHours()
          : startDate.getHours()
      }:${
        startDate.getMinutes() < 10
          ? "0" + startDate.getMinutes()
          : startDate.getMinutes()
      } Uhr`;
    } else {
      dateLabel.time = `${
        startDate.getHours() < 10
          ? "0" + startDate.getHours()
          : startDate.getHours()
      }:${
        startDate.getMinutes() < 10
          ? "0" + startDate.getMinutes()
          : startDate.getMinutes()
      } - ${
        endDate.getHours() < 10 ? "0" + endDate.getHours() : endDate.getHours()
      }:${
        endDate.getMinutes() < 10
          ? "0" + endDate.getMinutes()
          : endDate.getMinutes()
      } Uhr`;
    }
  }

  return dateLabel;
}
