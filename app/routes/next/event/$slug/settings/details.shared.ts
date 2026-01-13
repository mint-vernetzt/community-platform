import { z } from "zod";
import { transformEmptyToNull } from "~/lib/utils/schemas";
import { NAME_MIN_LENGTH } from "../../create.shared";

export function createEventDetailsSchema(locales: {
  nameRequired: string;
  nameMinLength: string;
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
    subline: z.string().optional().transform(transformEmptyToNull),
    description: z.string().optional().transform(transformEmptyToNull),
    descriptionRTEState: z.string().optional().transform(transformEmptyToNull),
    tags: z.array(z.string().trim().uuid()),
    eventTargetGroups: z.array(z.string().trim().uuid()),
    experienceLevelList: z.array(z.string().trim().uuid()),
    experienceLevel: z.string().optional().transform(transformEmptyToNull),
    focuses: z.array(z.string().trim().uuid()),
  });

  return schema;
}
