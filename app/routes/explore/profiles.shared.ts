import { z } from "zod";

export const PROFILE_SORT_VALUES = [
  "firstName-asc",
  "firstName-desc",
  "lastName-asc",
  "lastName-desc",
  "createdAt-desc",
] as const;

export type GetProfilesSchema = z.infer<typeof getProfilesSchema>;

export const getProfilesSchema = z.object({
  prfFilter: z
    .object({
      offer: z.array(z.string()),
      area: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (filter === undefined) {
        return {
          offer: [],
          area: [],
        };
      }
      return filter;
    }),
  prfSortBy: z
    .enum(PROFILE_SORT_VALUES)
    .optional()
    .transform((sortBy) => {
      if (typeof sortBy === "undefined") {
        return PROFILE_SORT_VALUES[0];
      }
      return sortBy;
    }),
  prfPage: z
    .number()
    .optional()
    .transform((page) => {
      if (page === undefined) {
        return 1;
      }
      return page;
    }),
  prfAreaSearch: z
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
