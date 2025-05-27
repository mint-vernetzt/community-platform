import { z } from "zod";

export const ORGANIZATION_SORT_VALUES = [
  "name-asc",
  "name-desc",
  "createdAt-desc",
] as const;

export type GetOrganizationsSchema = z.infer<typeof getOrganizationsSchema>;

export const getOrganizationsSchema = z.object({
  orgFilter: z
    .object({
      type: z.array(z.string()),
      networkType: z.array(z.string()),
      focus: z.array(z.string()),
      area: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (filter === undefined) {
        return {
          type: [],
          focus: [],
          area: [],
          networkType: [],
        };
      }
      return filter;
    }),
  orgSortBy: z
    .enum(ORGANIZATION_SORT_VALUES)
    .optional()
    .transform((sortBy) => {
      if (typeof sortBy === "undefined") {
        return ORGANIZATION_SORT_VALUES[0];
      }
      return sortBy;
    }),
  orgPage: z
    .number()
    .optional()
    .transform((page) => {
      if (page === undefined) {
        return 1;
      }
      return page;
    }),
  orgAreaSearch: z
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
