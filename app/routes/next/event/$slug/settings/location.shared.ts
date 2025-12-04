import { z } from "zod";

export const Stages = {
  Online: "online",
  OnSite: "on-site",
  Hybrid: "hybrid",
} as const;

export function createEventLocationSchema(locales: {
  stageRequired: string;
  stageInvalid: string;
}) {
  const schema = z.object({
    stage: z.enum(Object.values(Stages) as [string, ...string[]], {
      required_error: locales.stageRequired,
      invalid_type_error: locales.stageInvalid,
    }),
    venueName: z.string().optional(),
    venueStreet: z.string().optional(),
    venueZipCode: z.string().optional(),
    venueCity: z.string().optional(),
    venueCountry: z.string().optional(),
    conferenceLink: z.string().optional(),
    conferenceCode: z.string().optional(),
    accessibilityInformation: z.string().optional(),
    accessibilityInformationRTEState: z.string().optional(),
    privacyInformation: z.string().optional(),
    privacyInformationRTEState: z.string().optional(),
  });

  return schema;
}
