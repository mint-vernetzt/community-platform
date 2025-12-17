import { z } from "zod";
import { type ResetPasswordLocales } from "./index.server";

export const createRequestPasswordChangeSchema = (
  locales: ResetPasswordLocales
) => {
  return z.object({
    email: z
      .string({
        message: locales.validation.email,
      })
      .trim()
      .email(locales.validation.email),
    loginRedirect: z.string().optional(),
  });
};
