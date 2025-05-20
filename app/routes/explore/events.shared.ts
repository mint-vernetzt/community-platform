import { z } from "zod";

export const EVENT_SORT_VALUES = [
  "startTime-asc",
  "name-asc",
  "name-desc",
] as const;

export const periodOfTimeValues = [
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
        .enum(periodOfTimeValues)
        .optional()
        .transform((periodOfTime) => {
          if (periodOfTime === undefined) {
            return periodOfTimeValues[0];
          }
          return periodOfTime;
        }),
      area: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (filter === undefined) {
        return {
          stage: "all",
          focus: [],
          eventTargetGroup: [],
          periodOfTime: periodOfTimeValues[0],
          area: [],
        };
      }
      return filter;
    }),
  evtSortBy: z
    .enum(EVENT_SORT_VALUES)
    .optional()
    .transform((sortValue) => {
      if (sortValue !== undefined) {
        const splittedValue = sortValue.split("-");
        return {
          value: splittedValue[0],
          direction: splittedValue[1],
        };
      }
      return {
        value: EVENT_SORT_VALUES[0].split("-")[0],
        direction: EVENT_SORT_VALUES[0].split("-")[1],
      };
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
  evtAreaSearch: z
    .string()
    .optional()
    .transform((searchQuery) => {
      if (searchQuery === undefined) {
        return "";
      }
      return searchQuery;
    }),
  showFilters: z.boolean().optional(),
});
