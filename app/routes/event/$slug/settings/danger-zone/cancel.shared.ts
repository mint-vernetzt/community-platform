import { z } from "zod";

export const ConfirmModalSearchParam = "confirm";
export const HANDLING_CANCEL_CHILD_EVENTS_SEARCH_PARAM = "cancel";
export const CANCEL_ONLY_THIS = "this";
export const CANCEL_ALL = "all";

export function createCancelEventSchema() {
  const schema = z.object({
    [HANDLING_CANCEL_CHILD_EVENTS_SEARCH_PARAM]: z.enum([
      CANCEL_ONLY_THIS,
      CANCEL_ALL,
    ]),
  });
  return schema;
}
