import { type User } from "@supabase/supabase-js";
import { zonedTimeToUtc } from "date-fns-tz";
import { prismaClient } from "~/prisma.server";
import { deriveMode, type Mode } from "~/utils.server";

export type EventMode = Mode | "admin";

export async function deriveEventMode(
  sessionUser: User | null,
  slug: string
): Promise<EventMode> {
  const mode = deriveMode(sessionUser);
  const event = await prismaClient.event.findFirst({
    where: {
      slug,
      admins: {
        some: {
          profileId: sessionUser?.id || "",
        },
      },
    },
    select: {
      id: true,
    },
  });
  if (event !== null) {
    return "admin";
  }
  return mode;
}
// TODO: fix type issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relations: { parentEvent?: any; childEvents?: any } = {};
  if (relationOptions !== undefined) {
    if (relationOptions.parent !== null) {
      relations.parentEvent = { connect: { id: relationOptions.parent } };
    }
    if (relationOptions.child !== null) {
      relations.childEvents = { connect: { id: relationOptions.child } };
    }
  }

  const [profile] = await prismaClient.$transaction([
    prismaClient.profile.update({
      where: {
        id: profileId,
      },
      data: {
        teamMemberOfEvents: {
          create: {
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
      },
    }),
    prismaClient.event.update({
      where: {
        slug: eventOptions.slug,
      },
      data: {
        admins: {
          create: {
            profileId: profileId,
          },
        },
      },
    }),
  ]);
  return profile;
}
