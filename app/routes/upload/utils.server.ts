import { z } from "zod";

export const uploadKeys = ["avatar", "background", "logo", "document"];
export const uploadKey = z.string();
export const subject = z.string();
export type UploadKey = z.infer<typeof uploadKey>;
export type Subject = z.infer<typeof subject>;
