import { z } from "zod";

export const PARENT_EVENT_ID = "parentEventId";
export const ADD_PARENT_EVENT_INTENT = "add_parent_event";
export const REQUEST_TO_JOIN_PARENT_EVENT_INTENT =
  "request_to_join_parent_event";
export const CANCEL_PARENT_EVENT_JOIN_REQUEST_INTENT =
  "cancel_parent_event_join_request";
export const REMOVE_PARENT_EVENT_INTENT = "remove_parent_event";

export function createAddParentEventSchema() {
  return z.object({
    [PARENT_EVENT_ID]: z.string().uuid(),
  });
}

export function createRequestParentEventSchema() {
  return z.object({
    [PARENT_EVENT_ID]: z.string().uuid(),
  });
}

export function createCancelParentEventJoinRequestSchema() {
  return z.object({
    [PARENT_EVENT_ID]: z.string().uuid(),
  });
}
