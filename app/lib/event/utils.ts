import { Event } from "@prisma/client";
import { getRootEvent } from "~/event.server";
import { ArrayElement } from "../utils/types";

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

export function filterPublishedEvents(
  events: {
    event: Pick<Event, "published" | "startTime">;
  }[]
) {
  let publishedEvents = events.filter((item) => {
    return item.event.published;
  });

  return publishedEvents;
}

export function sortEventsAlphabetically(
  events: {
    event: Pick<Event, "id" | "parentEventId" | "name" | "slug" | "published">;
  }[]
) {
  let sortedEvents = events.sort((a, b) => {
    return a.event.name.localeCompare(b.event.name);
  });

  return sortedEvents;
}

export function sortEventsChronologically(
  events: {
    event: Pick<Event, "startTime" | "published">;
  }[]
) {
  let sortedEvents = events.sort(function sortEventsChronologically(a, b) {
    return a.event.startTime >= b.event.startTime ? 1 : -1;
  });

  return sortedEvents;
}

export function filterFutureEvents(
  events: {
    event: Pick<Event, "startTime" | "published">;
  }[]
) {
  let currentTime = new Date();
  let futureEvents = events.filter((item) => {
    if (item.event.startTime >= currentTime) {
      return item;
    }
    return null;
  });

  return futureEvents;
}
