import { z } from "zod";

export const schema = z.object({
  id: z.string().uuid(),
});
