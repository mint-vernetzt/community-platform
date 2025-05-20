import { z } from "zod";

export const FUNDING_SORT_VALUES = [
  "createdAt-desc",
  "title-asc",
  "title-desc",
] as const;

export const getFundingsSchema = z.object({
  fndFilter: z
    .object({
      types: z.array(z.string()),
      areas: z.array(z.string()),
      regions: z.array(z.string()),
      eligibleEntities: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (typeof filter === "undefined") {
        return {
          types: [],
          areas: [],
          regions: [],
          eligibleEntities: [],
        };
      }
      return filter;
    }),
  fndSortBy: z
    .enum(FUNDING_SORT_VALUES)
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
        value: FUNDING_SORT_VALUES[0].split("-")[0],
        direction: FUNDING_SORT_VALUES[0].split("-")[1],
      };
    }),
  fndPage: z
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

export type GetFundingsSchema = z.infer<typeof getFundingsSchema>;
