import { type Event } from "@prisma/client";
import { type User } from "@supabase/auth-helpers-remix";
import { zonedTimeToUtc } from "date-fns-tz";
import { type ArrayElement } from "~/lib/utils/types";
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
// TODO: fix any type
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
  // TODO: fix any type
  let relations: { parentEvent?: any; childEvents?: any } = {};
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

export async function getRootEvent(id: string) {
  try {
    const result = await prismaClient.$queryRaw`
      WITH RECURSIVE get_root AS (
          SELECT id, parent_event_id, name, slug, published 
          FROM "events" 
          WHERE id = ${id}
        UNION
          SELECT "events".id, "events".parent_event_id, "events".name, "events".slug, "events".published 
          FROM "events"
            JOIN get_root ON "events".id = get_root.parent_event_id
      )
      SELECT * 
      FROM get_root 
      WHERE parent_event_id IS NULL
      AND published = ${true}
      ORDER BY name ASC;`;

    return result as Pick<
      Event,
      "id" | "parentEventId" | "name" | "slug" | "published"
    >[];
  } catch (e) {
    console.error(e);
    return null;
  }
}

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
