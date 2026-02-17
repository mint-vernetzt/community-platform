import { z } from "zod";
import { hasContent } from "~/utils.shared";

export const SEARCH_CHILD_EVENTS_SEARCH_PARAM = "search_child_events";

export function getSearchChildEventsSchema() {
  return z.object({
    [SEARCH_CHILD_EVENTS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}

export function getParticipationSchema(locales: {
  // invalidProfileId: string; // Security?
  invalidEventId: string;
}) {
  const schema = z.object({
    eventId: z.string().uuid(locales.invalidEventId),
    // profileId: z.string().uuid(locales.invalidProfileId), // Security?
  });
  return schema;
}

export function hasSubline(event: {
  subline: string | null;
}): event is { subline: string } {
  return hasContent(event.subline);
}

export function hasDescription(event: {
  description: string | null;
}): event is { description: string } {
  return hasContent(event.description);
}
