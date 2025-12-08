import { zonedTimeToUtc } from "date-fns-tz";
import { z } from "zod";
import { type TIME_PERIOD_MULTI, TIME_PERIOD_SINGLE } from "./utils.shared";

export function createEventCreationSchema(options: {
  locales: {
    nameRequired: string;
    nameMinLength: string;
    startDateRequired: string;
    startDateInPast: string;
    startTimeInPast: string;
    endDateRequired: string;
    endDateInPast: string;
    endTimeInPast: string;
    endDateBeforeStartDate: string;
    endTimeBeforeStartTime: string;
    startTimeRequired: string;
    endTimeRequired: string;
    multiDaySameDay: string;
  };
  timePeriod: typeof TIME_PERIOD_SINGLE | typeof TIME_PERIOD_MULTI;
}) {
  const { locales, timePeriod } = options;
  let schema;

  if (timePeriod === TIME_PERIOD_SINGLE) {
    schema = z
      .object({
        name: z
          .string({
            required_error: locales.nameRequired,
          })
          .trim()
          .min(3, {
            message: locales.nameMinLength,
          }),
        startDate: z.date({
          required_error: locales.startDateRequired,
        }),
        startTime: z.string({
          required_error: locales.startTimeRequired,
        }),
        endTime: z.string({
          required_error: locales.endTimeRequired,
        }),
      })
      .transform((data, context) => {
        const today = new Date();
        const startTime = zonedTimeToUtc(
          `${data.startDate.toISOString().split("T")[0]} ${data.startTime}`,
          "Europe/Berlin"
        );
        const endTime = zonedTimeToUtc(
          `${data.startDate.toISOString().split("T")[0]} ${data.endTime}`,
          "Europe/Berlin"
        );
        // start time in the past
        if (startTime <= today) {
          if (startTime.getDate() < today.getDate()) {
            context.addIssue({
              path: ["startDate"],
              code: z.ZodIssueCode.custom,
              message: locales.startDateInPast,
            });
          } else {
            context.addIssue({
              path: ["startTime"],
              code: z.ZodIssueCode.custom,
              message: locales.startTimeInPast,
            });
          }
          return z.NEVER;
        }
        // end time in the past
        if (endTime <= today) {
          context.addIssue({
            path: ["endTime"],
            code: z.ZodIssueCode.custom,
            message: locales.endTimeInPast,
          });
          return z.NEVER;
        }
        // end time before start time
        if (endTime <= startTime) {
          context.addIssue({
            path: ["endTime"],
            code: z.ZodIssueCode.custom,
            message: locales.endTimeBeforeStartTime,
          });
          return z.NEVER;
        }

        const participationUntil = startTime;
        const oneDayInMillis = 86_400_000;
        const participationFrom = new Date(
          startTime.getTime() - oneDayInMillis
        );

        return {
          name: data.name,
          startTime,
          endTime,
          participationFrom,
          participationUntil,
        };
      });
  } else {
    schema = z
      .object({
        name: z
          .string({
            required_error: locales.nameRequired,
          })
          .trim()
          .min(3, {
            message: locales.nameMinLength,
          }),
        startDate: z.date({
          required_error: locales.startDateRequired,
        }),
        endDate: z.date({
          required_error: locales.endDateRequired,
        }),
      })
      .transform((data, context) => {
        const today = new Date();
        const startDateISO = data.startDate.toISOString().split("T")[0];
        const endDateISO = data.endDate.toISOString().split("T")[0];

        // multi day events should not be on the same day
        if (startDateISO === endDateISO) {
          context.addIssue({
            path: ["endDate"],
            code: z.ZodIssueCode.custom,
            message: locales.multiDaySameDay,
          });
          return z.NEVER;
        }

        const startTime = zonedTimeToUtc(
          `${startDateISO} 00:00`,
          "Europe/Berlin"
        );
        const endTime = zonedTimeToUtc(`${endDateISO} 23:59`, "Europe/Berlin");

        // start time in the past
        if (startTime <= today) {
          context.addIssue({
            path: ["startDate"],
            code: z.ZodIssueCode.custom,
            message: locales.startDateInPast,
          });
          return z.NEVER;
        }
        // end time in the past
        if (endTime <= today) {
          context.addIssue({
            path: ["endDate"],
            code: z.ZodIssueCode.custom,
            message: locales.endDateInPast,
          });
          return z.NEVER;
        }
        // end time before start time
        if (endTime <= startTime) {
          context.addIssue({
            path: ["endDate"],
            code: z.ZodIssueCode.custom,
            message: locales.endDateBeforeStartDate,
          });
          return z.NEVER;
        }

        const participationUntil = startTime;
        const oneDayInMillis = 86_400_000;
        const participationFrom = new Date(
          startTime.getTime() - oneDayInMillis
        );

        return {
          name: data.name,
          startTime,
          endTime,
          participationFrom,
          participationUntil,
        };
      });
  }
  return schema;
}
