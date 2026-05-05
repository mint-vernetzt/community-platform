import { z } from "zod";

export const SEARCH_WAITING_LIST_SEARCH_PARAM = "search_waiting_list";
export const PROFILE_ID = "profileId";

export function getSearchWaitingListSchema() {
  return z.object({
    [SEARCH_WAITING_LIST_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}

export function getMoveToParticipantsSchema() {
  return z.object({
    [PROFILE_ID]: z.string().uuid(),
  });
}
