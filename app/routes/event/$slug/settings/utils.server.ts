import { Event } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";
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
  currentUser: User | null
) {
  return await checkOwnership(event, currentUser, { throw: true });
}

export async function getNumberOfPrivilegedMembers(eventId: string) {
  const numberOfPrivilegedMembers = await prismaClient.teamMemberOfEvent.count({
    where: { isPrivileged: true },
  });
  return numberOfPrivilegedMembers;
}

export async function checkIdentityOrThrow(
  request: Request,
  currentUser: User
) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  const userId = formData.get("userId") as string | null;

  if (userId === null || userId !== currentUser.id) {
    throw unauthorized({ message: "Identity check failed" });
  }
}

export function transformEventToForm(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlugOrThrow>>>
) {
  const dateFormat = "yyyy-MM-dd";
  const timeFormat = "HH:mm";

  const startDate = format(event.startTime, dateFormat);
  const startTime = format(event.startTime, timeFormat);
  const endDate = format(event.endTime, dateFormat);
  const endTime = format(event.endTime, timeFormat);
  const participationUntilDate = format(event.participationUntil, dateFormat);
  const participationUntilTime = format(event.participationUntil, timeFormat);

  return {
    ...event,
    startDate,
    startTime,
    endDate,
    endTime,
    participationUntilDate,
    participationUntilTime,
    focuses: event.focuses.map((item) => item.focusId) ?? [],
  };
}

// TODO: any type
export function transformFormToEvent(form: any) {
  const {
    userId: _userId,
    submit: _submit,
    tags: _tags,
    types: _types,
    targetGroups: _targetGroups,
    experienceLevel: _experienceLevel,
    startDate,
    endDate,
    participationUntilDate,
    participationUntilTime,
    ...event
  } = form;

  const startTime = new Date(`${startDate} ${event.startTime}`);
  const endTime = new Date(`${endDate} ${event.endTime}`);
  const participationUntil = new Date(
    `${participationUntilDate} ${participationUntilTime}`
  );

  return {
    ...event,
    startTime,
    endTime,
    participationUntil,
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
    },
  });
}

export async function deleteEventById(id: string) {
  return await prismaClient.event.delete({ where: { id } });
}
