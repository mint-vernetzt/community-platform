import { z } from "zod";
import { type GeneralProjectSettingsLocales } from "./general.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { createPhoneSchema } from "~/lib/utils/schemas";

export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 80;
export const SUBLINE_MAX_LENGTH = 90;

export const createGeneralSchema = (locales: GeneralProjectSettingsLocales) =>
  z.object({
    name: z
      .string({
        required_error: locales.route.validation.name.required,
      })
      .trim()
      .min(
        NAME_MIN_LENGTH,
        insertParametersIntoLocale(locales.route.validation.name.min, {
          min: NAME_MIN_LENGTH,
        })
      )
      .max(
        NAME_MAX_LENGTH,
        insertParametersIntoLocale(locales.route.validation.name.max, {
          max: NAME_MAX_LENGTH,
        })
      ),
    subline: z
      .string()
      .trim()
      .max(
        90,
        insertParametersIntoLocale(locales.route.validation.subline.max, {
          max: SUBLINE_MAX_LENGTH,
        })
      )
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value;
      }),
    formats: z.array(z.string().trim().uuid()),
    furtherFormats: z.array(z.string().trim()),
    areas: z.array(z.string().trim().uuid()),
    email: z
      .string()
      .trim()
      .email(locales.route.validation.email.email)
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    phone: createPhoneSchema(locales)
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    contactName: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    street: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    zipCode: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    city: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
  });
