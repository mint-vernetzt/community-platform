import type { Event, Prisma } from "@prisma/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import { notFound, unauthorized } from "remix-utils";
import { getImageURL } from "~/images.server";
import { sanitizeUserHtml } from "~/lib/utils/sanitizeUserHtml";
import type { FormError } from "~/lib/utils/yup";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { type getEventBySlug } from "./general.server";

export async function checkOwnership(
  event: Pick<Event, "id">,
  currentUser: User | null,
  options: {
    throw: boolean;
  } = { throw: false }
) {
  let isOwner = false;
  if (currentUser !== null) {
    const relation = await prismaClient.teamMemberOfEvent.findFirst({
      where: {
        eventId: event.id,
        profileId: currentUser.id,
        isPrivileged: true,
      },
    });
    if (relation !== null) {
      isOwner = true;
    }
  }

  if (isOwner === false && options.throw) {
    throw unauthorized({ message: "Not privileged" });
  }

  return { isOwner };
}

export async function checkOwnershipOrThrow(
  event: Pick<Event, "id">,
  sessionUser: User | null
) {
  return await checkOwnership(event, sessionUser, { throw: true });
}

export async function isEventAdmin(slug: string, sessionUser: User | null) {
  let isAdmin = false;
  if (sessionUser !== null) {
    const relation = await prismaClient.event.findFirst({
      where: {
        slug,
        admins: {
          some: {
            profileId: sessionUser.id,
          },
        },
      },
    });
    if (relation !== null) {
      isAdmin = true;
    }
  }
  return isAdmin;
}

// Could be a top level function, as it's used in almost all actions
export async function checkIdentityOrThrow(
  request: Request,
  sessionUser: User
) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  // TODO: can this type assertion be removed and proofen by code?
  const formSenderId = formData.get("userId") as string | null;

  if (formSenderId === null || formSenderId !== sessionUser.id) {
    throw unauthorized({ message: "Identity check failed" });
  }
}

export function validateTimePeriods(
  // TODO: fix any type
  newEventData: any,
  parentEvent: { startTime: Date; endTime: Date } | null,
  childEvents: { startTime: Date; endTime: Date }[],
  currentErrors: FormError | null
): FormError | null {
  let errors = currentErrors;
  if (parentEvent !== null) {
    if (
      newEventData.startTime.getTime() < parentEvent.startTime.getTime() ||
      newEventData.endTime.getTime() > parentEvent.endTime.getTime()
    ) {
      const error = {
        endDate: {
          message: `Deine Veranstaltung liegt nicht im Zeitraum der Rahmenveranstaltung. Entferne entweder die Verknüpfung zur Rahmenveranstaltung unter "Verknüpfte Veranstaltungen" oder bestimme einen Zeitraum zwischen ${parentEvent.startTime} und ${parentEvent.endTime} für deine Veranstaltung.`,
          errors: [
            {
              type: "notInParentPeriodOfTime",
              message: `Deine Veranstaltung liegt nicht im Zeitraum der Rahmenveranstaltung. Entferne entweder die Verknüpfung zur Rahmenveranstaltung unter "Verknüpfte Veranstaltungen" oder bestimme einen Zeitraum zwischen ${parentEvent.startTime} und ${parentEvent.endTime} für deine Veranstaltung.`,
            },
          ],
        },
      };
      if (errors === null) {
        errors = error;
      } else {
        errors = { ...errors, ...error };
      }
    }
  }
  if (childEvents.length > 0) {
    let firstIteration = true;
    let earliestStartTime;
    let latestEndTime;
    for (let childEvent of childEvents) {
      if (firstIteration) {
        firstIteration = false;
        earliestStartTime = childEvent.startTime;
        latestEndTime = childEvent.endTime;
      } else {
        earliestStartTime =
          earliestStartTime !== undefined &&
          // TODO: fix type issue
          childEvent.startTime < earliestStartTime
            ? childEvent.startTime
            : earliestStartTime;
        latestEndTime =
          latestEndTime !== undefined && childEvent.endTime > latestEndTime
            ? childEvent.endTime
            : latestEndTime;
      }
    }
    if (
      earliestStartTime !== undefined &&
      latestEndTime !== undefined &&
      (earliestStartTime.getTime() < newEventData.startTime.getTime() ||
        latestEndTime.getTime() > newEventData.endTime.getTime())
    ) {
      const error = {
        endDate: {
          message: `Die zugehörigen Veranstaltungen deiner Veranstaltung liegen nicht im gewählten Zeitraum. Entferne entweder die Verknüpfung zu den zugehörigen Veranstaltungen unter "Verknüpfte Veranstaltungen" oder bestimme einen Zeitraum zwischen ${earliestStartTime} und ${latestEndTime} für deine Veranstaltung.`,
          errors: [
            {
              type: "notInChildPeriodOfTime",
              message: `Die zugehörigen Veranstaltungen deiner Veranstaltung liegen nicht im gewählten Zeitraum. Entferne entweder die Verknüpfung zu den zugehörigen Veranstaltungen unter "Verknüpfte Veranstaltungen" oder bestimme einen Zeitraum zwischen ${earliestStartTime} und ${latestEndTime} für deine Veranstaltung.`,
            },
          ],
        },
      };
      if (errors === null) {
        errors = error;
      } else {
        errors = { ...errors, ...error };
      }
    }
  }
  return errors;
}

export function transformEventToForm(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>
) {
  const startTimeZoned = utcToZonedTime(event.startTime, "Europe/Berlin");
  const endTimeZoned = utcToZonedTime(event.endTime, "Europe/Berlin");
  const participationUntilZoned = utcToZonedTime(
    event.participationUntil,
    "Europe/Berlin"
  );
  const participationFromZoned = utcToZonedTime(
    event.participationFrom,
    "Europe/Berlin"
  );

  const dateFormat = "yyyy-MM-dd";
  const timeFormat = "HH:mm";

  const startDate = format(startTimeZoned, dateFormat);
  const startTime = format(startTimeZoned, timeFormat);
  const endDate = format(endTimeZoned, dateFormat);
  const endTime = format(endTimeZoned, timeFormat);
  const participationUntilDate = format(participationUntilZoned, dateFormat);
  const participationUntilTime = format(participationUntilZoned, timeFormat);
  const participationFromDate = format(participationFromZoned, dateFormat);
  const participationFromTime = format(participationFromZoned, timeFormat);

  return {
    ...event,
    startDate,
    startTime,
    endDate,
    endTime,
    participationUntilDate,
    participationUntilTime,
    participationFromDate,
    participationFromTime,
    focuses: event.focuses.map((focus) => focus.focusId) ?? [],
    tags: event.tags.map((tag) => tag.tagId) ?? [],
    targetGroups:
      event.targetGroups.map((targetGroup) => targetGroup.targetGroupId) ?? [],
    types: event.types.map((type) => type.eventTypeId) ?? [],
    areas: event.areas.map((area) => area.areaId) ?? [],
    experienceLevel: event.experienceLevel?.id || "",
    stage: event.stage?.id || "",
  };
}

// TODO: fix any type
export function transformFormToEvent(form: any) {
  const {
    userId: _userId,
    submit: _submit,
    participantCount: _participantCount,
    // experienceLevel: _experienceLevel,
    startDate,
    endDate,
    participationUntilDate,
    participationUntilTime,
    participationFromDate,
    participationFromTime,
    ...event
  } = form;

  const startTime = zonedTimeToUtc(
    `${startDate} ${event.startTime}`,
    "Europe/Berlin"
  );
  const endTime = zonedTimeToUtc(
    `${endDate} ${event.endTime}`,
    "Europe/Berlin"
  );
  const participationUntil = zonedTimeToUtc(
    `${participationUntilDate} ${participationUntilTime}`,
    "Europe/Berlin"
  );
  const participationFrom = zonedTimeToUtc(
    `${participationFromDate} ${participationFromTime}`,
    "Europe/Berlin"
  );

  const description = sanitizeUserHtml(event.description);

  return {
    ...event,
    description,
    startTime,
    endTime,
    participationUntil,
    participationFrom,
  };
}

// TODO: fix any type
export async function updateEventById(
  id: string,
  eventData: any,
  privateFields: string[]
) {
  let eventVisibility = await prismaClient.eventVisibility.findFirst({
    where: {
      event: {
        id,
      },
    },
  });
  if (eventVisibility === null) {
    throw notFound("Event visibilities not found");
  }

  let visibility: keyof typeof eventVisibility;
  for (visibility in eventVisibility) {
    if (
      visibility !== "id" &&
      visibility !== "eventId" &&
      visibility !== "participationFrom" &&
      visibility !== "participationUntil" &&
      eventData.hasOwnProperty(visibility)
    ) {
      eventVisibility[visibility] = !privateFields.includes(`${visibility}`);
    }
    if (
      visibility === "participationFrom" ||
      visibility === "participationUntil"
    ) {
      eventVisibility[visibility] = !privateFields.includes(
        `${visibility}Time`
      );
    }
  }
  await prismaClient.$transaction([
    prismaClient.event.update({
      where: { id },
      data: {
        ...eventData,
        updatedAt: new Date(),
        focuses: {
          deleteMany: {},
          connectOrCreate: eventData.focuses.map((focusId: string) => {
            return {
              where: {
                eventId_focusId: {
                  focusId,
                  eventId: id,
                },
              },
              create: {
                focusId,
              },
            };
          }),
        },
        tags: {
          deleteMany: {},
          connectOrCreate: eventData.tags.map((tagId: string) => {
            return {
              where: {
                tagId_eventId: {
                  tagId,
                  eventId: id,
                },
              },
              create: {
                tagId,
              },
            };
          }),
        },
        types: {
          deleteMany: {},
          connectOrCreate: eventData.types.map((eventTypeId: string) => {
            return {
              where: {
                eventTypeId_eventId: {
                  eventTypeId,
                  eventId: id,
                },
              },
              create: {
                eventTypeId,
              },
            };
          }),
        },
        targetGroups: {
          deleteMany: {},
          connectOrCreate: eventData.targetGroups.map(
            (targetGroupId: string) => {
              return {
                where: {
                  targetGroupId_eventId: {
                    targetGroupId,
                    eventId: id,
                  },
                },
                create: {
                  targetGroupId,
                },
              };
            }
          ),
        },
        areas: {
          deleteMany: {},
          connectOrCreate: eventData.areas.map((areaId: string) => {
            return {
              where: {
                eventId_areaId: {
                  areaId,
                  eventId: id,
                },
              },
              create: {
                areaId,
              },
            };
          }),
        },
        experienceLevel:
          eventData.experienceLevel !== null
            ? { connect: { id: eventData.experienceLevel } }
            : { disconnect: true },
        stage:
          eventData.stage !== null
            ? { connect: { id: eventData.stage } }
            : { disconnect: true },
      },
    }),
    prismaClient.eventVisibility.update({
      where: {
        id: eventVisibility.id,
      },
      data: eventVisibility,
    }),
  ]);
}

export async function deleteEventById(id: string) {
  await prismaClient.event.delete({
    where: {
      id,
    },
  });
}

export async function getEventsOfPrivilegedMemberExceptOfGivenEvent(
  privilegedMemberId: string,
  currentEventId: string
) {
  const result = await prismaClient.teamMemberOfEvent.findMany({
    where: {
      profileId: privilegedMemberId,
      eventId: {
        not: currentEventId,
      },
      isPrivileged: true,
    },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          parentEventId: true,
        },
      },
    },
  });
  return result;
}

export function getOptionsFromEvents(
  events: Awaited<
    ReturnType<typeof getEventsOfPrivilegedMemberExceptOfGivenEvent>
  >
) {
  const options = events.map((item) => {
    const label = item.event.name;
    const value = item.event.id;
    return { label, value, hasParent: item.event.parentEventId !== null };
  });
  return options;
}

export async function getOrganizationById(id: string) {
  const organization = await prismaClient.organization.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      responsibleForEvents: {
        select: {
          event: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
  return organization;
}

export async function getProfileById(id: string) {
  const profile = await prismaClient.profile.findFirst({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      teamMemberOfEvents: {
        select: {
          event: {
            select: {
              id: true,
            },
          },
        },
      },
      contributedEvents: {
        select: {
          event: {
            select: {
              id: true,
            },
          },
        },
      },
      participatedEvents: {
        select: {
          event: {
            select: {
              id: true,
            },
          },
        },
      },
      waitingForEvents: {
        select: {
          event: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
  return profile;
}

export async function getParentEventSuggestions(
  authClient: SupabaseClient,
  alreadyParentId: string | undefined,
  query: string[],
  startTime: Date,
  endTime: Date,
  userId: string
) {
  let whereQueries = [];
  for (const word of query) {
    const contains: {
      OR: {
        [K in Event as string]: { contains: string; mode: Prisma.QueryMode };
      }[];
    } = {
      OR: [
        {
          name: {
            contains: word,
            mode: "insensitive",
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
  const parentEventSuggestions = await prismaClient.event.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      startTime: true,
      endTime: true,
      background: true,
      stage: {
        select: {
          title: true,
        },
      },
      _count: {
        select: {
          childEvents: true,
          participants: true,
          waitingList: true,
        },
      },
      participantLimit: true,
      subline: true,
      description: true,
    },
    where: {
      AND: [
        {
          NOT: {
            id: alreadyParentId,
          },
        },
        ...whereQueries,
        {
          startTime: {
            lte: startTime,
          },
        },
        {
          endTime: {
            gte: endTime,
          },
        },
        {
          teamMembers: {
            some: {
              profileId: userId,
              isPrivileged: true,
            },
          },
        },
      ],
    },
    take: 6,
    orderBy: {
      name: "asc",
    },
  });

  const enhancedParentEventSuggestions = parentEventSuggestions.map(
    (parentEvent) => {
      if (parentEvent.background !== null) {
        const publicURL = getPublicURL(authClient, parentEvent.background);
        if (publicURL !== null) {
          parentEvent.background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return parentEvent;
    }
  );
  return enhancedParentEventSuggestions;
}

export async function getChildEventSuggestions(
  authClient: SupabaseClient,
  alreadyChildIds: string[],
  query: string[],
  startTime: Date,
  endTime: Date,
  userId: string
) {
  let whereQueries = [];
  for (const word of query) {
    const contains: {
      OR: {
        [K in Event as string]: { contains: string; mode: Prisma.QueryMode };
      }[];
    } = {
      OR: [
        {
          name: {
            contains: word,
            mode: "insensitive",
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
  const childEventSuggestions = await prismaClient.event.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      startTime: true,
      endTime: true,
      background: true,
      stage: {
        select: {
          title: true,
        },
      },
      _count: {
        select: {
          childEvents: true,
          participants: true,
          waitingList: true,
        },
      },
      participantLimit: true,
      subline: true,
      description: true,
    },
    where: {
      AND: [
        {
          id: {
            notIn: alreadyChildIds,
          },
        },
        ...whereQueries,
        {
          startTime: {
            gte: startTime,
          },
        },
        {
          endTime: {
            lte: endTime,
          },
        },
        {
          teamMembers: {
            some: {
              profileId: userId,
              isPrivileged: true,
            },
          },
        },
      ],
    },
    take: 6,
    orderBy: {
      name: "asc",
    },
  });

  const enhancedChildEventSuggestions = childEventSuggestions.map(
    (childEvent) => {
      if (childEvent.background !== null) {
        const publicURL = getPublicURL(authClient, childEvent.background);
        if (publicURL !== null) {
          childEvent.background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return childEvent;
    }
  );
  return enhancedChildEventSuggestions;
}
