import { z } from "zod";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export const ABUSE_REPORT_INTENT = "submit-abuse-report";
export const REPORT_REASON_MAX_LENGTH = 80;
export const PARTICIPATE_INTENT = "participate";
export const WITHDRAW_PARTICIPATION_INTENT = "withdrawParticipation";
export const JOIN_WAITING_LIST_INTENT = "joinWaitingList";
export const LEAVE_WAITING_LIST_INTENT = "leaveWaitingList";
export const PARTICIPATE_AS_GUEST_INTENT = "participateAsGuest";

export const PARTICIPATE_ON_EVENT_INTENT_SEARCH_PARAM =
  "participate-on-event-intent";
export const PARTICIPATE_ON_EVENT_ANON_MODAL_SEARCH_PARAM =
  "modal-participate-on-event-anon";

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
    redirectTo: z
      .string()
      .optional()
      .refine((val) => {
        if (typeof val === "string") {
          return val.startsWith("/");
        }
        return true;
      }),
  });
}

export function createParticipationSchema(locales: {
  invalidProfileId: string;
}) {
  const schema = z.object({
    profileId: z.string().uuid(locales.invalidProfileId),
    redirectTo: z
      .string()
      .optional()
      .refine((val) => {
        if (typeof val === "string") {
          return val.startsWith("/");
        }
        return true;
      }),
  });
  return schema;
}

export const createRegisterSchema = (locales: {
  title: {
    options: {
      none: "Kein Titel" | "No title";
      dr: "Dr.";
      prof: "Prof.";
      profdr: "Prof. Dr.";
    };
  };
  validation: {
    firstName: string;
    lastName: string;
    email: string;
  };
}) => {
  return z.object({
    academicTitle: z
      .enum([
        locales.title.options.none,
        locales.title.options.dr,
        locales.title.options.prof,
        locales.title.options.profdr,
      ])
      .optional()
      .transform((value) => {
        if (
          typeof value === "undefined" ||
          value === locales.title.options.none
        ) {
          return null;
        }
        return value;
      }),
    firstName: z
      .string({
        message: locales.validation.firstName,
      })
      .trim(),
    lastName: z
      .string({
        message: locales.validation.lastName,
      })
      .trim(),
    email: z
      .string({
        message: locales.validation.email,
      })
      .trim()
      .email(locales.validation.email),
    loginRedirect: z.string().optional(),
  });
};
