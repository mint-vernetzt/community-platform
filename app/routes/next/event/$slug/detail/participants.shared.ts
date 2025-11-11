import { z } from "zod";

export const SEARCH_PARTICIPANTS_SEARCH_PARAM = "search_participants";

export function getSearchParticipantsSchema() {
  return z.object({
    [SEARCH_PARTICIPANTS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}
