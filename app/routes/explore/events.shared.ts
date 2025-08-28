import { z } from "zod";

export const EVENT_SORT_VALUES = [
  "startTime-asc",
  "name-asc",
  "name-desc",
] as const;

export const PERIOD_OF_TIME_VALUES = [
  "now",
  "thisWeek",
  "nextWeek",
  "thisMonth",
  "nextMonth",
  "past",
] as const;

export type GetEventsSchema = z.infer<typeof getEventsSchema>;

export const getEventsSchema = z.object({
  evtFilter: z
    .object({
      stage: z.string(),
      focus: z.array(z.string()),
      eventTargetGroup: z.array(z.string()),
      periodOfTime: z
        .enum(PERIOD_OF_TIME_VALUES)
        .optional()
        .transform((periodOfTime) => {
          if (periodOfTime === undefined) {
            return PERIOD_OF_TIME_VALUES[0];
          }
          return periodOfTime;
        }),
    })
    .optional()
    .transform((filter) => {
      if (filter === undefined) {
        return {
          stage: "all",
          focus: [],
          eventTargetGroup: [],
          periodOfTime: PERIOD_OF_TIME_VALUES[0],
        };
      }
      return filter;
    }),
  evtSortBy: z
    .enum(EVENT_SORT_VALUES)
    .optional()
    .transform((sortBy) => {
      if (typeof sortBy === "undefined") {
        return EVENT_SORT_VALUES[0];
      }
      return sortBy;
    }),
  evtPage: z
    .number()
    .optional()
    .transform((page) => {
      if (page === undefined) {
        return 1;
      }
      return page;
    }),
  showFilters: z.boolean().optional(),
});
