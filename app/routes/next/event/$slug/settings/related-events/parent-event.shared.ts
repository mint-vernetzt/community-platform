import { z } from "zod";

export const PARENT_EVENT_ID = "parentEventId";
export const ADD_PARENT_EVENT_INTENT = "add_parent_event";
export const REMOVE_PARENT_EVENT_INTENT = "remove_parent_event";

export function createAddParentEventSchema() {
  return z.object({
    [PARENT_EVENT_ID]: z.string().uuid(),
  });
}
