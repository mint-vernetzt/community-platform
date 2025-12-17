import { z } from "zod";
import { type ProfileSecurityLocales } from "./security.server";

export const changeEmailSchema = (locales: ProfileSecurityLocales) => {
  return z.object({
    email: z
      .string({
        message: locales.validation.email.required,
      })
      .trim()
      .min(1, locales.validation.email.min)
      .email(locales.validation.email.required),
    confirmEmail: z
      .string({
        message: locales.validation.confirmEmail.required,
      })
      .trim()
      .min(1, locales.validation.confirmEmail.min)
      .email(locales.validation.confirmEmail.required),
  });
};

export const changePasswordSchema = (locales: ProfileSecurityLocales) => {
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
  });
};
