import { z } from "zod";
import { type DeleteProjectLocales } from "./delete.server";

export function createSchema(locales: DeleteProjectLocales, name: string) {
  return z.object({
    name: z
      .string({
        required_error: locales.validation.name.required,
      })
      .refine((value) => {
        return value === name;
      }, locales.validation.name.noMatch),
  });
}
