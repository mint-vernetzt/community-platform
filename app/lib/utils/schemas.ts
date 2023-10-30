import { z } from "zod";
import { subject, uploadKey } from "~/routes/upload/utils.server";

export const fileUploadSchema = z.object({
  subject: subject,
  slug: z.string().min(1),
  uploadKey: uploadKey,
  redirect: z.string(),
});

export const phoneSchema = z
  .string()
  .regex(
    /^$|^(\+?[0-9\s-()]{3,}\/?[0-9\s-()]{4,})$/,
    "Bitte gib eine gültige Telefonnummer ein (Mindestens 7 Ziffern, Erlaubte Zeichen: Leerzeichen, +, -, (, ))."
  );
