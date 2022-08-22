import { Event } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { unauthorized } from "remix-utils";
import { prismaClient } from "~/prisma";

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

export async function checkIdentityOrThrow(
  request: Request,
  currentUser: User
) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  const id = formData.get("id") as string | null;

  if (id === null || id !== currentUser.id) {
    throw unauthorized({ message: "Identity check failed" });
  }
}

export function transformEventToForm(event: Event) {
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
  };
}

export function transformFormToEvent(form: any) {
  const {
    submit: _submit,
    areas: _areas,
    tags: _tags,
    types: _types,
    focuses: _focuses,
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

export async function updateEventById(id: string, data: any) {
  await prismaClient.event.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  });
}
