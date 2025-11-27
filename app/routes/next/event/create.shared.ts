import { zonedTimeToUtc } from "date-fns-tz";
import z from "zod";

export const TIME_PERIOD_SINGLE = "single";
export const TIME_PERIOD_MULTI = "multi";

export function createEventCreationSchema(locales: {
  nameRequired: string;
  startDateRequired: string;
  startDateInPast: string;
  endDateRequired: string;
  endDateInPast: string;
  endDateBeforeStartDate: string;
  startTimeRequired: string;
  endTimeRequired: string;
}) {
  const schema = z
    .object({
      name: z.string().optional(),
      timePeriod: z.enum([TIME_PERIOD_SINGLE, TIME_PERIOD_MULTI]),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    })
    .superRefine((data, context) => {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Validate event name
      // required
      if (typeof data.name === "undefined" || data.name.trim() === "") {
        context.addIssue({
          path: ["name"],
          code: z.ZodIssueCode.custom,
          message: locales.nameRequired,
        });
      }
      if (data.timePeriod === TIME_PERIOD_SINGLE) {
        // Validate start date
        // required
        if (typeof data.startDate === "undefined") {
          context.addIssue({
            path: ["startDate"],
            code: z.ZodIssueCode.custom,
            message: locales.startDateRequired,
          });
        } else {
          // in the past
          if (data.startDate < todayStart) {
            context.addIssue({
              path: ["startDate"],
              code: z.ZodIssueCode.custom,
              message: locales.startDateInPast,
            });
          }
        }
        // Validate start time
        if (typeof data.startTime !== "string" || data.startTime === "") {
          context.addIssue({
            path: ["startTime"],
            code: z.ZodIssueCode.custom,
            message: locales.startTimeRequired,
          });
        }
        // Validate end time
        if (typeof data.endTime !== "string" || data.endTime === "") {
          context.addIssue({
            path: ["endTime"],
            code: z.ZodIssueCode.custom,
            message: locales.endTimeRequired,
          });
        }
      }

      if (data.timePeriod === TIME_PERIOD_MULTI) {
        // Validate start date
        // required
        if (typeof data.startDate === "undefined") {
          context.addIssue({
            path: ["startDate"],
            code: z.ZodIssueCode.custom,
            message: locales.startDateRequired,
          });
        } else {
          // in the past
          if (data.startDate < todayStart) {
            context.addIssue({
              path: ["startDate"],
              code: z.ZodIssueCode.custom,
              message: locales.startDateInPast,
            });
          }
        }
        // Validate end date
        // required
        if (typeof data.endDate === "undefined") {
          context.addIssue({
            path: ["endDate"],
            code: z.ZodIssueCode.custom,
            message: locales.endDateRequired,
          });
        } else {
          // in the past
          if (data.endDate < todayEnd) {
            context.addIssue({
              path: ["endDate"],
              code: z.ZodIssueCode.custom,
              message: locales.endDateInPast,
            });
          }
        }
        // end date before start date
        if (
          typeof data.endDate !== "undefined" &&
          typeof data.startDate !== "undefined" &&
          data.endDate < data.startDate
        ) {
          context.addIssue({
            path: ["endDate"],
            code: z.ZodIssueCode.custom,
            message: locales.endDateBeforeStartDate,
          });
        }
      }
    })
    .transform((data, context) => {
      let startTime: Date;
      let endTime: Date;

      if (typeof data.name === "undefined") {
        return z.NEVER;
      }

      if (data.timePeriod === TIME_PERIOD_SINGLE) {
        if (
          typeof data.startDate === "undefined" ||
          typeof data.startTime === "undefined" ||
          typeof data.endTime === "undefined"
        ) {
          console.log({ data });
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
        if (
          typeof data.startDate === "undefined" ||
          typeof data.endDate === "undefined"
        ) {
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

      if (startTime >= endTime) {
        const path =
          data.timePeriod === TIME_PERIOD_SINGLE ? ["endTime"] : ["endDate"];

        context.addIssue({
          path,
          code: z.ZodIssueCode.custom,
          message: locales.endDateBeforeStartDate,
        });
      }

      const participationUntil = startTime;
      const oneDayInMillis = 86_400_000;
      const participationFrom = new Date(startTime.getTime() - oneDayInMillis);

      return {
        name: data.name,
        startTime,
        endTime,
        participationFrom,
        participationUntil,
      };
    });
  return schema;
}
