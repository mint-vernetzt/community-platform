import { z } from "zod";

export const uploadKeys = ["avatar", "background", "logo", "document"];
export const uploadKey = z.enum(["avatar", "background", "logo", "document"]);
export const subject = z.enum(["user", "organization", "event", "project"]);
export type UploadKey = z.infer<typeof uploadKey>;
export type Subject = z.infer<typeof subject>;
