import z from "zod";
import { checkboxSchema } from "~/lib/utils/schemas";

export const UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT =
  "update-move-up-to-participants";
export const UPDATE_PARTICIPANT_LIMIT_INTENT = "update-participant-limit";
export const LIMIT_BELOW_CURRENT_PARTICIPANTS_SEARCH_PARAM =
  "limitBelowCurrentParticipants";
export const MOVE_UP_TO_PARTICIPANTS_AUTOMATICALLY_MODAL_SEARCH_PARAM =
  "moveUpToParticipantsAutomaticallyModal";

export const HANDLE_MOVE_UP_TO_PARTICIPANTS_AUTOMATICALLY_KEY =
  "handleMoveUpToParticipantsAutomatically";

export const ACCEPT_MOVE_UP_TO_PARTICIPANTS_INTENT =
  "accept-move-up-to-participants";
export const DECLINE_MOVE_UP_TO_PARTICIPANTS_INTENT =
  "decline-move-up-to-participants";

export function createMoveUpToParticipantsSchema() {
  return z.object({
    moveUpToParticipants: checkboxSchema,
  });
}

export function createParticipantLimitSchema() {
  return z.object({
    participantLimit: z
      .number()
      .int()
      .positive()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined") {
          return null;
        }
        return value;
      }),
    [HANDLE_MOVE_UP_TO_PARTICIPANTS_AUTOMATICALLY_KEY]: z
      .enum([
        ACCEPT_MOVE_UP_TO_PARTICIPANTS_INTENT,
        DECLINE_MOVE_UP_TO_PARTICIPANTS_INTENT,
      ])
      .optional(),
  });
}
