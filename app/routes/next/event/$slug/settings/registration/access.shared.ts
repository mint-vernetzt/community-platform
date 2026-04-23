import z from "zod";
import { transformEmptyToNull } from "~/lib/utils/schemas";

export const SET_REGISTRATION_TYPE_TO_INTERNAL_INTENT =
  "set-registration-type-to-internal";
export const SET_REGISTRATION_TYPE_TO_EXTERNAL_INTENT =
  "set-registration-type-to-external";
export const SET_REGISTRATION_ACCESS_TO_OPEN_INTENT =
  "set-registration-access-to-open";
export const SET_REGISTRATION_ACCESS_TO_CLOSED_INTENT =
  "set-registration-access-to-closed";
export const UPDATE_EXTERNAL_REGISTRATION_URL_INTENT =
  "update-external-registration-url";

export function createExternalRegistrationUrlSchema(options: {
  locales: { invalidUrl: string; required: string };
}) {
  const { locales } = options;
  const schema = z.object({
    externalRegistrationUrl: z
      .string()
      .url(locales.invalidUrl)
      .optional()
      .transform(transformEmptyToNull),
  });
  return schema;
}
