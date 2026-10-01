import z from "zod";
import { type DeleteProfileLocales } from "./delete.server";

export const createSchema = (locales: DeleteProfileLocales) => {
  return z.object({
    confirmedToken: z
      .string({
        required_error: locales.validation.confirmed.message,
      })
      .regex(
        new RegExp(locales.validation.confirmed.regex),
        locales.validation.confirmed.message
      ),
  });
};
