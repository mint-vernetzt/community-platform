import { zonedTimeToUtc } from "date-fns-tz";
import { z } from "zod";
import { TIME_PERIOD_MULTI, TIME_PERIOD_SINGLE } from "../../utils.shared";

export function createTimePeriodSchema(options: {
  locales: {
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
  };
  parentEvent:
    | {
        startTime: Date;
        endTime: Date;
      }
    | undefined;
  childEvents:
    | {
        earliestStartTime: Date;
        latestEndTime: Date;
      }
    | undefined;
}) {
  const { locales, parentEvent, childEvents } = options;
  const schema = z
    .object({
      timePeriod: z.enum([TIME_PERIOD_SINGLE, TIME_PERIOD_MULTI]),
      startDate: z.date({
        required_error: locales.startDateRequired,
      }),
      endDate: z.date().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    })
    .transform((data, context) => {
      const today = new Date();
      let startTime: Date;
      let endTime: Date;

      if (data.timePeriod === TIME_PERIOD_SINGLE) {
        // Validate start time
        if (typeof data.startTime !== "string" || data.startTime === "") {
          context.addIssue({
            path: ["startTime"],
            code: z.ZodIssueCode.custom,
            message: locales.startTimeRequired,
          });
          return z.NEVER;
        }
        // Validate end time
        if (typeof data.endTime !== "string" || data.endTime === "") {
          context.addIssue({
            path: ["endTime"],
            code: z.ZodIssueCode.custom,
            message: locales.endTimeRequired,
          });
          return z.NEVER;
        }
        startTime = zonedTimeToUtc(
          `${data.startDate.toISOString().split("T")[0]} ${data.startTime}`,
          "Europe/Berlin"
        );
        endTime = zonedTimeToUtc(
          `${data.startDate.toISOString().split("T")[0]} ${data.endTime}`,
          "Europe/Berlin"
        );
      } else {
        // Validate end date
        // required
        if (typeof data.endDate === "undefined") {
          context.addIssue({
            path: ["endDate"],
            code: z.ZodIssueCode.custom,
            message: locales.endDateRequired,
          });
          return z.NEVER;
        }
        startTime = zonedTimeToUtc(
          `${data.startDate.toISOString().split("T")[0]} 00:00`,
          "Europe/Berlin"
        );
        endTime = zonedTimeToUtc(
          `${data.endDate.toISOString().split("T")[0]} 23:59`,
          "Europe/Berlin"
        );
      }
      // end time before start time
      if (endTime < startTime) {
        context.addIssue({
          path: ["endDate"],
          code: z.ZodIssueCode.custom,
          message: locales.endDateBeforeStartDate,
        });
        context.addIssue({
          path: ["endTime"],
          code: z.ZodIssueCode.custom,
          message: locales.endTimeBeforeStartTime,
        });
      }
      // start time in the past
      if (startTime < today) {
        context.addIssue({
          path: ["startDate"],
          code: z.ZodIssueCode.custom,
          message: locales.startDateInPast,
        });
        context.addIssue({
          path: ["startTime"],
          code: z.ZodIssueCode.custom,
          message: locales.startTimeInPast,
        });
      }
      // end time in the past
      if (endTime < today) {
        context.addIssue({
          path: ["endDate"],
          code: z.ZodIssueCode.custom,
          message: locales.endDateInPast,
        });
        context.addIssue({
          path: ["endTime"],
          code: z.ZodIssueCode.custom,
          message: locales.endTimeInPast,
        });
      }
      // TODO: validate against parent and child events

      return {
        startTime,
        endTime,
      };
    });
  return schema;
}
