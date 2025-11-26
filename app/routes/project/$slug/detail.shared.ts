import { z } from "zod";
import { INTENT_FIELD_NAME } from "~/form-helpers";

export const publishSchema = z.object({
  [INTENT_FIELD_NAME]: z.enum(["publish", "hide"]),
  redirectTo: z
    .string()
    .optional()
    .refine((val) => {
      if (typeof val === "string") {
        return val.startsWith("/");
      }
      return true;
    }),
});
