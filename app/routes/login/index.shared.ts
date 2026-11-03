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
    email: z.email(locales.validation.email).trim(),
    password: z
      .string({
        message: locales.validation.password.required,
      })
      .min(8, locales.validation.password.min),
    loginRedirect: z.string().optional(),
  });
};
