import { z } from "zod";

export const SEARCH_PARTICIPANTS_SEARCH_PARAM = "search_participants";
export const CONFIRM_MODAL_SEARCH_PARAM = "confirm_remove_participant";
export const PARTICIPANT_ID = "participantId";

export function getSearchParticipantsSchema() {
  return z.object({
    [SEARCH_PARTICIPANTS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}

export function getRemoveParticipantSchema() {
  return z.object({
    [PARTICIPANT_ID]: z.string().uuid(),
  });
}

export function getConfirmationModalSearchParam(profileId: string) {
  return `${CONFIRM_MODAL_SEARCH_PARAM}_${profileId}`;
}
