import { z } from "zod";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export const ABUSE_REPORT_INTENT = "submit-abuse-report";
export const REPORT_REASON_MAX_LENGTH = 80;

export function createAbuseReportSchema(locales: { maxLength: string }) {
  return z.object({
    [INTENT_FIELD_NAME]: z.enum([ABUSE_REPORT_INTENT]),
    reasons: z.array(z.string()),
    otherReason: z
      .string()
      .max(
        REPORT_REASON_MAX_LENGTH,
        insertParametersIntoLocale(locales.maxLength, {
          max: REPORT_REASON_MAX_LENGTH,
        })
      )
      .optional(),
  });
}
