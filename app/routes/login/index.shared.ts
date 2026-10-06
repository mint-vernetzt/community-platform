import { z } from "zod";

export const createLoginSchema = (locales: {
  validation: {
    email: string;
    password: {
      required: string;
      min: string;
    };
  };
}) => {
  return z.object({
    email: z
      .string({
        message: locales.validation.email,
      })
      .trim()
      .email(locales.validation.email),
    password: z
      .string({
        message: locales.validation.password.required,
      })
      .min(8, locales.validation.password.min),
    loginRedirect: z.string().optional(),
  });
};
