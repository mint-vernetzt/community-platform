import { Event } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";
import { unstable_parseMultipartFormData, UploadHandler } from "remix";
import { unauthorized } from "remix-utils";
import { prismaClient } from "~/prisma";
import { getEventBySlugOrThrow } from "../utils.server";

export async function checkOwnership(
  event: Event,
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
  event: Event,
  sessionUser: User | null
) {
  return await checkOwnership(event, sessionUser, { throw: true });
}

// Could be a top level function, as it's used in almost all actions
export async function checkIdentityOrThrow(
  request: Request,
  sessionUser: User,
  isMultipartFormData: boolean = false
) {
  const clonedRequest = request.clone();
  let formData: FormData;

  // TODO: This should not be used anymore
  // Instead when checking identity on a multipart form:
  // First parse multipartFormData with parseMultipart() in storage.server.ts
  // Then check identity (and do other authorization stuff)
  // Then if authorization succeeded persist multipart in storage via doPersist() in storage.server.ts
  if (isMultipartFormData) {
    const multipartFormDataProvider: UploadHandler = async () => {
      // This upload handler only provides the multipart form data but does not upload anything
      return undefined;
    };
    formData = await unstable_parseMultipartFormData(
      clonedRequest,
      multipartFormDataProvider
    );
  } else {
    formData = await clonedRequest.formData();
  }

  const userId = formData.get("userId") as string | null;

  if (userId === null || userId !== sessionUser.id) {
    throw unauthorized({ message: "Identity check failed" });
  }
}

export function transformEventToForm(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlugOrThrow>>>
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

// TODO: any type
export function transformFormToEvent(form: any) {
  const {
    userId: _userId,
    submit: _submit,
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

  return {
    ...event,
    startTime,
    endTime,
    participationUntil,
    participationFrom,
  };
}

// TODO: any type
export async function updateEventById(id: string, data: any) {
  await prismaClient.event.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
      focuses: {
        deleteMany: {},
        connectOrCreate: data.focuses.map((focusId: string) => {
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
        connectOrCreate: data.tags.map((tagId: string) => {
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
        connectOrCreate: data.types.map((eventTypeId: string) => {
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
        connectOrCreate: data.targetGroups.map((targetGroupId: string) => {
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
        }),
      },
      areas: {
        deleteMany: {},
        connectOrCreate: data.areas.map((areaId: string) => {
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
        data.experienceLevel !== null
          ? { connect: { id: data.experienceLevel } }
          : { disconnect: true },
      stage:
        data.stage !== null
          ? { connect: { id: data.stage } }
          : { disconnect: true },
    },
  });
}

export async function deleteEventById(id: string) {
  return await prismaClient.event.delete({ where: { id } });
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

export function getTeamMemberProfileDataFromEvent(
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>,
  currentUserId: string
) {
  const profileData = event.teamMembers.map((teamMember) => {
    const { isPrivileged, profile } = teamMember;
    const isCurrentUser = profile.id === currentUserId;
    return { isPrivileged, ...profile, isCurrentUser };
  });
  return profileData;
}

export function getSpeakerProfileDataFromEvent(
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>
) {
  const profileData = event.speakers.map((speaker) => {
    const { profile } = speaker;
    return profile;
  });
  return profileData;
}

export function getResponsibleOrganizationDataFromEvent(
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>
) {
  const organizationData = event.responsibleOrganizations.map((item) => {
    return item.organization;
  });
  return organizationData;
}

export function getParticipantsDataFromEvent(
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>
) {
  const participantsData = event.participants.map((item) => {
    return { ...item.profile, createdAt: item.createdAt };
  });
  const waitingListData = event.waitingList.map((item) => {
    return { ...item.profile, createdAt: item.createdAt };
  });
  return { participants: participantsData, waitingList: waitingListData };
}
