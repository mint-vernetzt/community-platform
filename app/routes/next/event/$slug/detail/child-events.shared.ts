import { z } from "zod";

export const SEARCH_CHILD_EVENTS_SEARCH_PARAM = "search_child_events";

export function getSearchChildEventsSchema() {
  return z.object({
    [SEARCH_CHILD_EVENTS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}

export function hasSubline(event: { subline: string | null }): boolean {
  return event.subline !== null && event.subline.trim().length > 0;
}

export function hasDescription(event: { description: string | null }): boolean {
  return event.description !== null && event.description.trim().length > 0;
}
