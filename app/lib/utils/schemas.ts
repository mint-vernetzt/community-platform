import { z } from "zod";
import { subject, uploadKey } from "~/routes/upload/utils.server";

export const fileUploadSchema = z.object({
  subject: subject,
  slug: z.string().min(1),
  uploadKey: uploadKey,
  redirect: z.string(),
});
