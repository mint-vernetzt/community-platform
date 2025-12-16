import { z } from "zod";
import { checkboxSchema } from "~/lib/utils/schemas";

export const schema = z.object({
  updates: checkboxSchema,
});
