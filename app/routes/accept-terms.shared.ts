import { z } from "zod";
import { checkboxSchema } from "~/lib/utils/schemas";

export const acceptTermsSchema = z.object({
  termsAccepted: checkboxSchema,
  redirectTo: z.string().optional(),
});
