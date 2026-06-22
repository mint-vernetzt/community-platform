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
    eventNotInParentEventBoundaries: string;
    childEventsNotInEventBoundaries: string;
    multiDaySameDay: string;
  };
  timePeriod: typeof TIME_PERIOD_SINGLE | typeof TIME_PERIOD_MULTI;
  parentEvent: {
    startTime: Date;
    endTime: Date;
  } | null;
  childEvents: {
    earliestStartTime: Date;
    latestEndTime: Date;
  } | null;
}) {
  const { locales, timePeriod, parentEvent, childEvents } = options;
  let schema;

  if (timePeriod === TIME_PERIOD_SINGLE) {
    schema = z
      .object({
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

        if (parentEvent !== null) {
          // validate against parentEvent
          if (startTime < parentEvent.startTime) {
            if (startTime.getDate() < parentEvent.startTime.getDate()) {
              context.addIssue({
                path: ["startDate"],
                code: z.ZodIssueCode.custom,
                message: locales.eventNotInParentEventBoundaries,
              });
            } else {
              context.addIssue({
                path: ["startTime"],
                code: z.ZodIssueCode.custom,
                message: locales.eventNotInParentEventBoundaries,
              });
            }
            return z.NEVER;
          }
          if (endTime > parentEvent.endTime) {
            context.addIssue({
              path: ["endTime"],
              code: z.ZodIssueCode.custom,
              message: locales.eventNotInParentEventBoundaries,
            });
            return z.NEVER;
          }
        }

        if (childEvents !== null) {
          // validate against childEvents
          if (startTime > childEvents.earliestStartTime) {
            if (startTime.getDate() > childEvents.earliestStartTime.getDate()) {
              context.addIssue({
                path: ["startDate"],
                code: z.ZodIssueCode.custom,
                message: locales.childEventsNotInEventBoundaries,
              });
            } else {
              context.addIssue({
                path: ["startTime"],
                code: z.ZodIssueCode.custom,
                message: locales.childEventsNotInEventBoundaries,
              });
            }
            return z.NEVER;
          }
          if (endTime < childEvents.latestEndTime) {
            context.addIssue({
              path: ["endTime"],
              code: z.ZodIssueCode.custom,
              message: locales.childEventsNotInEventBoundaries,
            });
            return z.NEVER;
          }
        }

        return {
          startTime,
          endTime,
        };
      });
  } else {
    schema = z
      .object({
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

        if (parentEvent !== null) {
          // validate against parentEvent
          if (startTime < parentEvent.startTime) {
            context.addIssue({
              path: ["startDate"],
              code: z.ZodIssueCode.custom,
              message: locales.eventNotInParentEventBoundaries,
            });
            return z.NEVER;
          }
          if (endTime > parentEvent.endTime) {
            context.addIssue({
              path: ["endDate"],
              code: z.ZodIssueCode.custom,
              message: locales.eventNotInParentEventBoundaries,
            });
            return z.NEVER;
          }
        }

        if (childEvents !== null) {
          // validate against parentEvent
          if (startTime > childEvents.earliestStartTime) {
            context.addIssue({
              path: ["startDate"],
              code: z.ZodIssueCode.custom,
              message: locales.childEventsNotInEventBoundaries,
            });
            return z.NEVER;
          }
          if (endTime < childEvents.latestEndTime) {
            context.addIssue({
              path: ["endDate"],
              code: z.ZodIssueCode.custom,
              message: locales.childEventsNotInEventBoundaries,
            });
            return z.NEVER;
          }
        }

        return {
          startTime,
          endTime,
        };
      });
  }
  return schema;
}

export function getTimePeriodDefaultValue(options: {
  timePeriodSearchParam: string | null;
  formattedStartDate: string; // yyyy-MM-dd
  formattedEndDate: string; // yyyy-MM-dd
}) {
  const { timePeriodSearchParam, formattedStartDate, formattedEndDate } =
    options;

  if (timePeriodSearchParam === TIME_PERIOD_SINGLE) {
    return TIME_PERIOD_SINGLE;
  }
  if (timePeriodSearchParam === TIME_PERIOD_MULTI) {
    return TIME_PERIOD_MULTI;
  }
  if (timePeriodSearchParam === null) {
    if (formattedStartDate === formattedEndDate) {
      return TIME_PERIOD_SINGLE;
    } else {
      return TIME_PERIOD_MULTI;
    }
  }
  return TIME_PERIOD_SINGLE;
}
