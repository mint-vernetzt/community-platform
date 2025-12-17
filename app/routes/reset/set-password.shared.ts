import { z } from "zod";
import { type SetPasswordLocales } from "./set-password.server";

export const createSetPasswordSchema = (locales: SetPasswordLocales) => {
  return z.object({
    password: z
      .string({
        message: locales.validation.password.required,
      })
      .min(8, locales.validation.password.min),
    confirmPassword: z
      .string({
        message: locales.validation.confirmPassword.required,
      })
      .min(8, locales.validation.confirmPassword.min),
    loginRedirect: z.string().optional(),
  });
};
