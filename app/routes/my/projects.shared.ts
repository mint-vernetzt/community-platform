import { z } from "zod";

export const quitProjectSchema = z.object({
  projectId: z.string(),
});
