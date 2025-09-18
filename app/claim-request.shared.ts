import { z } from "zod";
import { INTENT_FIELD_NAME } from "~/form-helpers";

export const CLAIM_REQUEST_INTENTS = {
  create: "create-claim-request",
  withdraw: "withdraw-claim-request",
} as const;

export const claimRequestSchema = z.object({
  [INTENT_FIELD_NAME]: z.enum([
    CLAIM_REQUEST_INTENTS.create,
    CLAIM_REQUEST_INTENTS.withdraw,
  ]),
});
