import { z } from "zod";
import { type ResetPasswordLocales } from "./index.server";

export const createRequestPasswordChangeSchema = (
  locales: ResetPasswordLocales
) => {
  return z.object({
    email: z.email(locales.validation.email).trim(),
    loginRedirect: z.string().optional(),
  });
};
