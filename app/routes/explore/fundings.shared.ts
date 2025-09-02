import { z } from "zod";

export const FUNDING_SORT_VALUES = [
  "createdAt-desc",
  "title-asc",
  "title-desc",
] as const;

export const getFundingsSchema = z.object({
  fndFilter: z
    .object({
      types: z.array(z.string().trim()),
      areas: z.array(z.string().trim()),
      regions: z.array(z.string().trim()),
      eligibleEntities: z.array(z.string().trim()),
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
    .transform((sortBy) => {
      if (typeof sortBy === "undefined") {
        return FUNDING_SORT_VALUES[0];
      }
      return sortBy;
    }),
  fndPage: z
    .number()
    .optional()
    .transform((page) => {
      if (typeof page === "undefined") {
        return 1;
      }
      return page;
    }),
  showFilters: z.boolean().optional(),
});

export type GetFundingsSchema = z.infer<typeof getFundingsSchema>;
