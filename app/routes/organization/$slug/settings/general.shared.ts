import { z } from "zod";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { checkboxSchema, createPhoneSchema } from "~/lib/utils/schemas";
import { removeHtmlTags, replaceHtmlEntities } from "~/lib/utils/transformHtml";
import { NAME_MAX_LENGTH, NAME_MIN_LENGTH } from "../../create.shared";
import { type GeneralOrganizationSettingsLocales } from "./general.server";

export const BIO_MAX_LENGTH = 2000;

export const createGeneralSchema = (
  locales: GeneralOrganizationSettingsLocales,
  organization: {
    street: string | null;
    zipCode: string | null;
    city: string | null;
  }
) => {
  const { street, zipCode, city } = organization;
  return z.object({
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
    email: z
      .string()
      .trim()
      .email(locales.route.validation.email)
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    phone: createPhoneSchema(locales)
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    street:
      street === null
        ? z
            .string()
            .trim()
            .optional()
            .transform((value) => {
              if (typeof value === "undefined" || value === "") {
                return null;
              }
              return value;
            })
        : z
            .string({
              required_error: locales.route.validation.street.required,
            })
            .trim(),
    zipCode:
      zipCode === null
        ? z
            .string()
            .trim()
            .optional()
            .transform((value) => {
              if (typeof value === "undefined" || value === "") {
                return null;
              }
              return value;
            })
        : z
            .string({
              required_error: locales.route.validation.zipCode.required,
            })
            .trim(),
    city:
      city === null
        ? z
            .string()
            .trim()
            .optional()
            .transform((value) => {
              if (typeof value === "undefined" || value === "") {
                return null;
              }
              return value;
            })
        : z
            .string({
              required_error: locales.route.validation.city.required,
            })
            .trim(),
    addressSupplement: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    bio: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            BIO_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.bio.max,
            { max: BIO_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    bioRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    supportedBy: z.array(z.string().trim()).optional(),
    areas: z.array(z.string().trim().uuid()),
    focuses: z.array(z.string().trim().uuid()),
    visibilities: z.object({
      email: checkboxSchema,
      phone: checkboxSchema,
    }),
  });
};
