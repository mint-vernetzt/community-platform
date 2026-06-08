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
  event: {
    id: string;
    _count: { childEvents: number };
  };
  external?: boolean;
  openForRegistration?: boolean;
}) {
  const { event, external, openForRegistration } = options;

  let data: {
    external?: boolean;
    openForRegistration?: boolean;
    parentParticipationRequired?: boolean;
    externalRegistrationUrl?: null;
  } = {
    external,
    openForRegistration,
  };

  // Ensure defaults if switching the external registration setting
  if (typeof external !== "undefined") {
    data = {
      ...data,
      openForRegistration: true,
      parentParticipationRequired:
        event._count.childEvents > 0 ? external === false : undefined,
      externalRegistrationUrl: external === false ? null : undefined,
    };
  }

  // Ensure defaults if switching the open for registration setting
  if (typeof openForRegistration !== "undefined") {
    data = {
      ...data,
      external: false,
      externalRegistrationUrl: null,
      parentParticipationRequired:
        event._count.childEvents > 0 ? openForRegistration === true : undefined,
    };
  }

  const updatedEvent = await prismaClient.event.update({
    where: { id: event.id },
    data,
  });

  return updatedEvent;
}

export async function updateEventExternalRegistrationUrl(options: {
  event: {
    id: string;
    external: boolean;
  };
  externalRegistrationUrl: string | null;
}) {
  const { event, externalRegistrationUrl } = options;

  if (event.external === false) {
    throw new Error(
      "Cannot set external registration URL for an event that is not external"
    );
  }

  const updatedEvent = await prismaClient.event.update({
    where: { id: event.id },
    data: {
      externalRegistrationUrl,
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
