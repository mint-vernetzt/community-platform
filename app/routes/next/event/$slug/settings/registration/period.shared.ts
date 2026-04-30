import { zonedTimeToUtc } from "date-fns-tz";
import z from "zod";

export const SET_REGISTRATION_PERIOD_TO_DEFAULT_INTENT =
  "set_registration_period_to_default";
export const UPDATE_REGISTRATION_PERIOD_INTENT = "update_registration_period";
export const REGISTRATION_PERIOD_SEARCH_PARAM = "registration_period";
export const REGISTRATION_PERIOD_DEFAULT = "default";
export const REGISTRATION_PERIOD_CUSTOM = "custom";

export function createRegistrationPeriodSchema(options: {
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  participationFrom: Date;
  participationUntil: Date;
  locales: {
    errors: {
      participationFromDateRequired: string;
      participationFromTimeRequired: string;
      participationUntilDateRequired: string;
      participationUntilTimeRequired: string;
      participationUntilDateInPast: string;
      participationUntilTimeInPast: string;
      participationFromDateAfterParticipationUntilDate: string;
      participationFromTimeAfterParticipationUntilTime: string;
      participationFromDateAfterStartDate: string;
      participationFromTimeAfterStartTime: string;
    };
  };
}) {
  const schema = z
    .object({
      participationFromDate: z.date({
        required_error: options.locales.errors.participationFromDateRequired,
      }),
      participationFromTime: z.string({
        required_error: options.locales.errors.participationFromTimeRequired,
      }),
      participationUntilDate: z.date({
        required_error: options.locales.errors.participationUntilDateRequired,
      }),
      participationUntilTime: z.string({
        required_error: options.locales.errors.participationUntilTimeRequired,
      }),
    })
    .transform((data, context) => {
      const participationFrom = zonedTimeToUtc(
        `${data.participationFromDate.toISOString().split("T")[0]} ${data.participationFromTime}`,
        "Europe/Berlin"
      );
      const participationUntil = zonedTimeToUtc(
        `${data.participationUntilDate.toISOString().split("T")[0]} ${data.participationUntilTime}`,
        "Europe/Berlin"
      );

      // participationUntil in past
      const now = new Date();
      if (participationUntil <= now) {
        const participationUntilCopy = new Date(participationUntil);
        participationUntilCopy.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        if (participationUntilCopy < today) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["participationUntilDate"],
            message: options.locales.errors.participationUntilDateInPast,
          });
        } else {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["participationUntilTime"],
            message: options.locales.errors.participationUntilTimeInPast,
          });
        }
        return z.NEVER;
      }

      // participationFrom after participationUntil
      if (participationFrom >= participationUntil) {
        const participationFromCopy = new Date(participationFrom);
        participationFromCopy.setHours(0, 0, 0, 0);
        const participationUntilCopy = new Date(participationUntil);
        participationUntilCopy.setHours(0, 0, 0, 0);
        if (participationFromCopy > participationUntilCopy) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["participationFromDate"],
            message:
              options.locales.errors
                .participationFromDateAfterParticipationUntilDate,
          });
        } else {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["participationFromTime"],
            message:
              options.locales.errors
                .participationFromTimeAfterParticipationUntilTime,
          });
        }
        return z.NEVER;
      }

      // participationFrom after start
      const endDate = options.endDate;
      if (participationFrom >= endDate) {
        const participationFromCopy = new Date(participationFrom);
        participationFromCopy.setHours(0, 0, 0, 0);
        const endDateCopy = new Date(endDate);
        endDateCopy.setHours(0, 0, 0, 0);
        if (participationFromCopy > endDateCopy) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["participationFromDate"],
            message: options.locales.errors.participationFromDateAfterStartDate,
          });
        } else {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["participationFromTime"],
            message: options.locales.errors.participationFromTimeAfterStartTime,
          });
        }
        return z.NEVER;
      }

      return {
        participationFrom,
        participationUntil,
      };
    });
  return schema;
}
