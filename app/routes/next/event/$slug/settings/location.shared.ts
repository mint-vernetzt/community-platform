import { z } from "zod";

export const Stages = {
  Online: "online",
  OnSite: "on-site",
  Hybrid: "hybrid",
} as const;

function transformEmptyToNull(value: string | undefined): string | null {
  if (
    typeof value === "undefined" ||
    value.trim() === "" ||
    value.trim() === "<p></p>" ||
    value.trim() === "<p><br></p>"
  ) {
    return null;
  }
  return value;
}

export function createEventLocationSchema(locales: {
  stageRequired: string;
  stageInvalid: string;
}) {
  const schema = z.object({
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
  });

  return schema;
}

export function getDefault(value: string | null | undefined): string {
  if (typeof value === "undefined" || value === null || value.trim() === "") {
    return "";
  }
  return value;
}

export function isSame(
  valueA: string | null | undefined,
  valueB: string | null | undefined
): boolean {
  const a = valueA === undefined || valueA === null ? "" : valueA.trim();
  const b = valueB === undefined || valueB === null ? "" : valueB.trim();
  return a === b;
}
