import { z } from "zod";
import { transformEmptyToNull } from "~/lib/utils/schemas";

export const Stages = {
  Online: "online",
  OnSite: "on-site",
  Hybrid: "hybrid",
} as const;

export function createEventLocationSchema(locales: {
  stageRequired: string;
  stageInvalid: string;
}) {
  const schema = z
    .object({
      stage: z.enum(Object.values(Stages) as [string, ...string[]], {
        required_error: locales.stageRequired,
        invalid_type_error: locales.stageInvalid,
      }),
      venueName: z.string().optional().transform(transformEmptyToNull),
      venueStreet: z.string().optional().transform(transformEmptyToNull),
      venueZipCode: z.string().optional().transform(transformEmptyToNull),
      venueCity: z.string().optional().transform(transformEmptyToNull),
      conferenceLink: z.string().optional().transform(transformEmptyToNull),
      conferenceCode: z.string().optional().transform(transformEmptyToNull),
      accessibilityInformation: z
        .string()
        .optional()
        .transform(transformEmptyToNull),
      accessibilityInformationRTEState: z
        .string()
        .optional()
        .transform(transformEmptyToNull),
      privacyInformation: z.string().optional().transform(transformEmptyToNull),
      privacyInformationRTEState: z
        .string()
        .optional()
        .transform(transformEmptyToNull),
    })
    .transform((data) => {
      if (data.stage === Stages.Online) {
        return {
          ...data,
          venueName: null,
          venueStreet: null,
          venueZipCode: null,
          venueCity: null,
        };
      }
      if (data.stage === Stages.OnSite) {
        return {
          ...data,
          conferenceLink: null,
          conferenceCode: null,
        };
      }
      return data;
    });

  return schema;
}

export function getStageDefaultValue(options: {
  stageSearchParam: string | null;
  stageFromDb: string | null;
}) {
  const { stageSearchParam, stageFromDb } = options;

  if (stageSearchParam === Stages.OnSite) {
    return Stages.OnSite;
  }
  if (stageSearchParam === Stages.Online) {
    return Stages.Online;
  }
  if (stageSearchParam === Stages.Hybrid) {
    return Stages.Hybrid;
  }
  return stageFromDb as (typeof Stages)[keyof typeof Stages] | null;
}
