import { prismaClient } from "~/prisma.server";
import {
  SET_PARENT_PARTICIPATION_TO_NOT_REQUIRED_INTENT,
  SET_PARENT_PARTICIPATION_TO_REQUIRED_INTENT,
} from "./access.shared";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      published: true,
      external: true,
      openForRegistration: true,
      externalRegistrationUrl: true,
      parentParticipationRequired: true,
      parentEvent: {
        select: {
          parentParticipationRequired: true,
        },
      },
      _count: {
        select: {
          childEvents: true,
        },
      },
    },
  });
  return event;
}

export async function updateEventRegistrationAccess(options: {
  eventId: string;
  external?: boolean;
  openForRegistration?: boolean;
}) {
  const updatedEvent = await prismaClient.event.update({
    where: { id: options.eventId },
    data: {
      external: options.external,
      openForRegistration: options.openForRegistration,
    },
  });

  return updatedEvent;
}

export async function updateEventExternalRegistrationUrl(options: {
  eventId: string;
  externalRegistrationUrl: string | null;
}) {
  const updatedEvent = await prismaClient.event.update({
    where: { id: options.eventId },
    data: {
      externalRegistrationUrl: options.externalRegistrationUrl,
    },
  });

  return updatedEvent;
}

export async function updateParentParticipationRequired(options: {
  event: {
    id: string;
    parentEvent: { parentParticipationRequired: boolean | null } | null;
    _count: { childEvents: number };
  };
  intent:
    | typeof SET_PARENT_PARTICIPATION_TO_REQUIRED_INTENT
    | typeof SET_PARENT_PARTICIPATION_TO_NOT_REQUIRED_INTENT;
}) {
  // TODO:
  // - Check if we are on a parent or a child event
  // - Check what to ensure and to update in either case (published restriction, etc...)
  // - Then update accordingly
  const { event, intent } = options;

  let parentParticipationRequired;
  if (event._count.childEvents > 0) {
    // Event is parent
    if (intent === SET_PARENT_PARTICIPATION_TO_REQUIRED_INTENT) {
      // Set parentParticipationRequired to true on parent event
      parentParticipationRequired = true;
    }
    if (intent === SET_PARENT_PARTICIPATION_TO_NOT_REQUIRED_INTENT) {
      // Set parentParticipationRequired to false on parent event
      parentParticipationRequired = false;
    }
  }

  if (event.parentEvent !== null) {
    // Event is child
    if (
      intent === SET_PARENT_PARTICIPATION_TO_REQUIRED_INTENT &&
      event.parentEvent.parentParticipationRequired === true
    ) {
      // Set parentParticipationRequired to null on child event
      parentParticipationRequired = null;
    }
    if (intent === SET_PARENT_PARTICIPATION_TO_NOT_REQUIRED_INTENT) {
      // Set parentParticipationRequired to false on child event
      parentParticipationRequired = false;
    }
  }

  if (typeof parentParticipationRequired !== "undefined") {
    await prismaClient.event.update({
      where: { id: event.id },
      data: {
        parentParticipationRequired,
      },
    });
  }
}
