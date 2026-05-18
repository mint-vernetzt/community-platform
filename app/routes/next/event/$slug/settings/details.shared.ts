import { z } from "zod";
import { transformEmptyToNull } from "~/lib/utils/schemas";
import { NAME_MIN_LENGTH } from "../../create.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { removeHtmlTags, replaceHtmlEntities } from "~/lib/utils/transformHtml";

export const SUBLINE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 2000;

export function createEventDetailsSchema(locales: {
  nameRequired: string;
  nameMinLength: string;
  sublineMaxLength: string;
  descriptionMaxLength: string;
}) {
  const schema = z.object({
    name: z
      .string({
        required_error: locales.nameRequired,
      })
      .trim()
      .min(NAME_MIN_LENGTH, {
        message: locales.nameMinLength,
      }),
    types: z.array(z.string().trim().uuid()),
    subline: z
      .string()
      .trim()
      .max(
        SUBLINE_MAX_LENGTH,
        insertParametersIntoLocale(locales.sublineMaxLength, {
          max: SUBLINE_MAX_LENGTH,
        })
      )
      .optional()
      .transform(transformEmptyToNull),
    description: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            DESCRIPTION_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(locales.descriptionMaxLength, {
            max: DESCRIPTION_MAX_LENGTH,
          }),
        }
      )
      .transform(transformEmptyToNull),
    descriptionRTEState: z.string().optional().transform(transformEmptyToNull),
    tags: z.array(z.string().trim().uuid()),
    eventTargetGroups: z.array(z.string().trim().uuid()),
    experienceLevelList: z.array(z.string().trim().uuid()),
    experienceLevel: z.string().optional().transform(transformEmptyToNull),
    focuses: z.array(z.string().trim().uuid()),
  });

  return schema;
}
