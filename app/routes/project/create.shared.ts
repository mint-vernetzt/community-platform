import { z } from "zod";
import { type CreateProjectLocales } from "./create.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 80;

export const createSchema = (locales: CreateProjectLocales) =>
  z.object({
    projectName: z
      .string({
        required_error: locales.validation.projectName.required,
      })
      .trim()
      .min(
        NAME_MIN_LENGTH,
        insertParametersIntoLocale(locales.validation.projectName.min, {
          min: NAME_MIN_LENGTH,
        })
      )
      .max(
        NAME_MAX_LENGTH,
        insertParametersIntoLocale(locales.validation.projectName.max, {
          max: NAME_MAX_LENGTH,
        })
      ),
  });
