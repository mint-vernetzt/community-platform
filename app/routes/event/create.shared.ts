import { zonedTimeToUtc } from "date-fns-tz";
import { z } from "zod";
import { type TIME_PERIOD_MULTI, TIME_PERIOD_SINGLE } from "./utils.shared";

export const NAME_MIN_LENGTH = 3;

function createSingleSchema(options: {
  locales: {
    nameRequired: string;
    nameMinLength: string;
    startDateRequired: string;
    startTimeRequired: string;
    endTimeRequired: string;
  };
}) {
  const { locales } = options;

  return z.object({
    name: z.string(locales.nameRequired).trim().min(NAME_MIN_LENGTH, {
      message: locales.nameMinLength,
    }),
    startDate: z.date(locales.startDateRequired),
    startTime: z.string(locales.startTimeRequired),
    endTime: z.string(locales.endTimeRequired),
  });
}

function createMultiSchema(options: {
  locales: {
    nameRequired: string;
    nameMinLength: string;
    startDateRequired: string;
    endDateRequired: string;
  };
}) {
  const { locales } = options;

  return z.object({
    name: z.string(locales.nameRequired).trim().min(NAME_MIN_LENGTH, {
      message: locales.nameMinLength,
    }),
    startDate: z.date(locales.startDateRequired),
    endDate: z.date(locales.endDateRequired),
  });
}

export function createEventCreationConstraintsSchema<
  T extends typeof TIME_PERIOD_SINGLE | typeof TIME_PERIOD_MULTI,
>(options: {
  locales: {
    nameRequired: string;
    nameMinLength: string;
    startDateRequired: string;
    startTimeRequired: string;
    endDateRequired: string;
    endTimeRequired: string;
  };
  timePeriod: T;
}) {
  const { locales } = options;
  let schema;

  if (options.timePeriod === TIME_PERIOD_SINGLE) {
    schema = createSingleSchema({ locales });
  } else {
    schema = createMultiSchema({ locales });
  }
  return schema as T extends typeof TIME_PERIOD_SINGLE
    ? ReturnType<typeof createSingleSchema>
    : ReturnType<typeof createMultiSchema>;
}

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
    eventNotInParentEventBoundaries: string;
    multiDaySameDay: string;
  };
  timePeriod: typeof TIME_PERIOD_SINGLE | typeof TIME_PERIOD_MULTI;
  parentEvent: {
    id: string;
    startTime: Date;
    endTime: Date;
  } | null;
}) {
  const { locales, timePeriod, parentEvent } = options;
  let schema;

  if (timePeriod === TIME_PERIOD_SINGLE) {
    schema = createEventCreationConstraintsSchema({
      locales,
      timePeriod,
    }).transform((data, context) => {
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
            code: "custom",
            message: locales.startDateInPast,
          });
        } else {
          context.addIssue({
            path: ["startTime"],
            code: "custom",
            message: locales.startTimeInPast,
          });
        }
        return z.NEVER;
      }
      // end time in the past
      if (endTime <= today) {
        context.addIssue({
          path: ["endTime"],
          code: "custom",
          message: locales.endTimeInPast,
        });
        return z.NEVER;
      }
      // end time before start time
      if (endTime <= startTime) {
        context.addIssue({
          path: ["endTime"],
          code: "custom",
          message: locales.endTimeBeforeStartTime,
        });
        return z.NEVER;
      }

      const participationUntil = startTime;

      if (parentEvent !== null) {
        // validate against parentEvent
        if (startTime < parentEvent.startTime) {
          if (startTime.getDate() < parentEvent.startTime.getDate()) {
            context.addIssue({
              path: ["startDate"],
              code: "custom",
              message: locales.eventNotInParentEventBoundaries,
            });
          } else {
            context.addIssue({
              path: ["startTime"],
              code: "custom",
              message: locales.eventNotInParentEventBoundaries,
            });
          }
          return z.NEVER;
        }
        if (endTime > parentEvent.endTime) {
          context.addIssue({
            path: ["endTime"],
            code: "custom",
            message: locales.eventNotInParentEventBoundaries,
          });
          return z.NEVER;
        }
      }

      return {
        name: data.name,
        startTime,
        endTime,
        participationUntil,
        parentEventId: parentEvent === null ? null : parentEvent.id,
      };
    });
  } else {
    schema = createEventCreationConstraintsSchema({
      locales,
      timePeriod,
    }).transform((data, context) => {
      const today = new Date();
      const startDateISO = data.startDate.toISOString().split("T")[0];
      const endDateISO = data.endDate.toISOString().split("T")[0];

      // multi day events should not be on the same day
      if (startDateISO === endDateISO) {
        context.addIssue({
          path: ["endDate"],
          code: "custom",
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
          code: "custom",
          message: locales.startDateInPast,
        });
        return z.NEVER;
      }
      // end time in the past
      if (endTime <= today) {
        context.addIssue({
          path: ["endDate"],
          code: "custom",
          message: locales.endDateInPast,
        });
        return z.NEVER;
      }
      // end time before start time
      if (endTime <= startTime) {
        context.addIssue({
          path: ["endDate"],
          code: "custom",
          message: locales.endDateBeforeStartDate,
        });
        return z.NEVER;
      }

      const participationUntil = startTime;

      if (parentEvent !== null) {
        // validate against parentEvent
        if (startTime < parentEvent.startTime) {
          context.addIssue({
            path: ["startDate"],
            code: "custom",
            message: locales.eventNotInParentEventBoundaries,
          });
          return z.NEVER;
        }
        if (endTime > parentEvent.endTime) {
          context.addIssue({
            path: ["endDate"],
            code: "custom",
            message: locales.eventNotInParentEventBoundaries,
          });
          return z.NEVER;
        }
      }

      return {
        name: data.name,
        startTime,
        endTime,
        participationUntil,
        parentEventId: parentEvent === null ? null : parentEvent.id,
      };
    });
  }
  return schema;
}
