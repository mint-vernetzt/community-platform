import type { User } from "@supabase/auth-helpers-remix";
import { zonedTimeToUtc } from "date-fns-tz";
import { unauthorized } from "remix-utils";
import { prismaClient } from "~/prisma";

export async function checkIdentityOrThrow(
  request: Request,
  sessionUser: User
) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  const formSenderId = formData.get("userId");

  if (formSenderId === null || formSenderId !== sessionUser.id) {
    throw unauthorized({ message: "Identity check failed" });
  }
}

export function transformFormToEvent(form: any) {
  const { startDate, endDate, ...event } = form;

  const startTime = zonedTimeToUtc(
    `${startDate} ${event.startTime}`,
    "Europe/Berlin"
  );
  const endTime = zonedTimeToUtc(
    `${endDate} ${event.endTime}`,
    "Europe/Berlin"
  );
  const oneDayInMillis = 86_400_000;

  return {
    ...event,
    startTime,
    endTime,
    participationUntil: startTime,
    participationFrom: new Date(startTime.getTime() - oneDayInMillis),
  };
}

export async function createEventOnProfile(
  profileId: string,
  eventOptions: {
    slug: string;
    name: string;
    startTime: Date;
    endTime: Date;
    participationUntil: Date;
    participationFrom: Date;
  },
  relationOptions?: {
    child: string | null;
    parent: string | null;
  }
) {
  let relations: { parentEvent?: any; childEvents?: any } = {};
  if (relationOptions !== undefined) {
    if (relationOptions.parent !== null) {
      relations.parentEvent = { connect: { id: relationOptions.parent } };
    }
    if (relationOptions.child !== null) {
      relations.childEvents = { connect: { id: relationOptions.child } };
    }
  }

  const profile = prismaClient.profile.update({
    where: {
      id: profileId,
    },
    data: {
      teamMemberOfEvents: {
        create: {
          isPrivileged: true,
          event: {
            create: {
              ...eventOptions,
              ...relations,
              eventVisibility: {
                create: {},
              },
            },
          },
        },
      },
      updatedAt: new Date(),
    },
  });
  return profile;
}
