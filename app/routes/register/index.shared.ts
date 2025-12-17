import { z } from "zod";
import { type RegisterLocales } from "./index.server";
import { checkboxSchema } from "~/lib/utils/schemas";

export const createRegisterSchema = (locales: RegisterLocales) => {
  return z.object({
    academicTitle: z
      .enum([
        locales.form.title.options.none,
        locales.form.title.options.dr,
        locales.form.title.options.prof,
        locales.form.title.options.profdr,
      ])
      .optional()
      .transform((value) => {
        if (
          typeof value === "undefined" ||
          value === locales.form.title.options.none
        ) {
          return null;
        }
        return value;
      }),
    firstName: z
      .string({
        message: locales.validation.firstName,
      })
      .trim(),
    lastName: z
      .string({
        message: locales.validation.lastName,
      })
      .trim(),
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
    termsAccepted: checkboxSchema,
    loginRedirect: z.string().optional(),
  });
};
