import z from "zod";
import { checkboxSchema } from "~/lib/utils/schemas";

export const UPDATE_MOVE_UP_TO_PARTICIPANTS_INTENT =
  "update-move-up-to-participants";

export function createMoveUpToParticipantsSchema() {
  return z.object({
    moveUpToParticipants: checkboxSchema,
  });
}
