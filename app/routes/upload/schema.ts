import { z } from "zod";

export const uploadKeys = ["avatar", "background", "logo", "document"];
const uploadKey = z.enum(["avatar", "background", "logo", "document"]);

const subject = z.enum(["user", "organisation"]);
export type UploadKey = z.infer<typeof uploadKey>;
export type Subject = z.infer<typeof subject>;

export const schema = z.object({
  subject: subject,
  slug: z.string().min(1),
  uploadKey: uploadKey,
  redirect: z.string(),
  csrf: z.string().min(1),
});

export const environment = z.object({
  profileId: z.string().min(1),
  request: z.unknown(),
});
