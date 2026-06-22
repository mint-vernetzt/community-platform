import z from "zod";
import { checkboxSchema } from "~/lib/utils/schemas";

export const UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT =
  "update-move-up-to-participants";
export const UPDATE_PARTICIPANT_LIMIT_INTENT = "update-participant-limit";
export const LIMIT_BELOW_CURRENT_PARTICIPANTS_SEARCH_PARAM =
  "limitBelowCurrentParticipants";
export const FILL_UP_PARTICIPANTS_AUTOMATICALLY_MODAL_SEARCH_PARAM =
  "fillUpParticipantsAutomaticallyModal";

export const FILL_UP_PARTICIPANTS_AUTOMATICALLY =
  "fillUpParticipantsAutomatically";

export const ACCEPT_FILL_UP_PARTICIPANTS_AUTOMATICALLY =
  "accept-fill-up-participants-automatically";
export const DECLINE_FILL_UP_PARTICIPANTS_AUTOMATICALLY =
  "decline-fill-up-participants-automatically";

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
    [FILL_UP_PARTICIPANTS_AUTOMATICALLY]: z
      .enum([
        ACCEPT_FILL_UP_PARTICIPANTS_AUTOMATICALLY,
        DECLINE_FILL_UP_PARTICIPANTS_AUTOMATICALLY,
      ])
      .optional(),
  });
}
