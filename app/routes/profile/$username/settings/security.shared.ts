import { z } from "zod";

export const changeEmailSchema = (locales: {
  validation: {
    email: {
      required: string;
      min: string;
    };
    confirmEmail: {
      required: string;
      min: string;
    };
  };
}) => {
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

export const changePasswordSchema = (locales: {
  validation: {
    password: {
      required: string;
      min: string;
    };
    confirmPassword: {
      required: string;
      min: string;
    };
  };
}) => {
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
