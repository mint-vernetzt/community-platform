import { Event } from "@prisma/client";
import { getEventById } from "~/event.server";

export async function getRootEvents(
  events: {
    event: Pick<Event, "parentEventId" | "name" | "slug" | "published">;
  }[]
) {
  let rootEvents: typeof events = [];
  await Promise.all(
    events.map(async (item) => {
      let rootItem: { event: Awaited<ReturnType<typeof getEventById>> } = {
        event: item.event,
      };

      while (rootItem.event !== null && rootItem.event.parentEventId !== null) {
        rootItem.event = await getEventById(rootItem.event.parentEventId);
      }
      if (rootItem.event === null) {
        console.log(`Could not find root element of event ${item.event.name}`);
        return;
      }
      if (
        !rootEvents.some((item) => {
          // TODO: Fix type issue. Why is there a type issue? Null is not possible at this location
          // @ts-ignore
          return item.event.slug === rootItem.event.slug;
        })
      ) {
        // TODO: Fix type issue. Why is there a type issue? Null is not possible at this location
        // @ts-ignore
        rootEvents.push(rootItem);
      }
    })
  );

  return rootEvents;
}

export function filterPublishedEvents(
  events: {
    event: Pick<Event, "parentEventId" | "name" | "slug" | "published">;
  }[]
) {
  let publishedEvents = events.filter((item) => {
    return item.event.published;
  });

  return publishedEvents;
}

export function sortEventsAlphabetically(
  events: {
    event: Pick<Event, "parentEventId" | "name" | "slug" | "published">;
  }[]
) {
  let sortedEvents = events.sort((a, b) => {
    return a.event.name.localeCompare(b.event.name);
  });

  return sortedEvents;
}
