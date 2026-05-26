import { z } from "zod";

export const EVENT_ID = "childEventId";
export const ADD_CHILD_EVENT_INTENT = "add_child_event";
export const REMOVE_CHILD_EVENT_INTENT = "remove_child_event";

export function createAddOrRemoveChildEventSchema() {
  return z.object({
    [EVENT_ID]: z.string().uuid(),
  });
}
