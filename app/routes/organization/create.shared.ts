import { z } from "zod";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type CreateOrganizationLocales } from "./create.server";

export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 80;

export const createOrganizationMemberRequestSchema = z.object({
  organizationId: z.string(),
});

export const createOrganizationSchema = (
  locales: CreateOrganizationLocales
) => {
  return z.object({
    organizationName: z
      .string({
        required_error: locales.route.validation.organizationName.required,
      })
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
    organizationTypes: z.array(z.string().uuid()),
    networkTypes: z.array(z.string().uuid()),
  });
};
