import z from "zod";
import { checkboxSchema } from "~/lib/utils/schemas";

export const UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT =
  "update-move-up-to-participants";
export const UPDATE_PARTICIPANT_LIMIT_INTENT = "update-participant-limit";

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
  });
}
