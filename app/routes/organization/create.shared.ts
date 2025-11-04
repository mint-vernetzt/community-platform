import { z } from "zod";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type CreateOrganizationLocales } from "./create.server";

export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 80;

export const createOrganizationMemberRequestSchema = z.object({
  organizationId: z.string().trim().uuid(),
});

export const createOrganizationSchema = (
  locales: CreateOrganizationLocales
) => {
  return z.object({
    organizationName: z
      .string({
        required_error: locales.route.validation.organizationName.required,
      })
      .trim()
      .min(
        NAME_MIN_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.organizationName.min,
          {
            min: NAME_MIN_LENGTH,
          }
        )
      )
      .max(
        NAME_MAX_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.organizationName.max,
          {
            max: NAME_MAX_LENGTH,
          }
        )
      ),
    organizationTypes: z.array(z.string().trim().uuid()),
    networkTypes: z.array(z.string().trim().uuid()),
    street: z
      .string({
        required_error: locales.route.validation.street.required,
      })
      .trim(),
    zipCode: z
      .string({
        required_error: locales.route.validation.zipCode.required,
      })
      .trim(),
    city: z
      .string({
        required_error: locales.route.validation.city.required,
      })
      .trim(),
    addressSupplement: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (value === undefined || value === "") {
          return null;
        }
        return value;
      }),
  });
};
