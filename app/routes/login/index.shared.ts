import { z } from "zod";
import { type LandingPageLocales } from "../index.server";
import { type LoginLocales } from "./index.server";

export const createLoginSchema = (
  locales: LoginLocales | LandingPageLocales["route"]
) => {
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
