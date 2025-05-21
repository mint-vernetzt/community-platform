import { z } from "zod";

export const PROJECT_SORT_VALUES = [
  "name-asc",
  "name-desc",
  "createdAt-desc",
] as const;

export type GetProjectsSchema = z.infer<typeof getProjectsSchema>;

export const getProjectsSchema = z.object({
  prjFilter: z
    .object({
      discipline: z.array(z.string()),
      additionalDiscipline: z.array(z.string()),
      projectTargetGroup: z.array(z.string()),
      area: z.array(z.string()),
      format: z.array(z.string()),
      specialTargetGroup: z.array(z.string()),
      financing: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (filter === undefined) {
        return {
          discipline: [],
          additionalDiscipline: [],
          projectTargetGroup: [],
          area: [],
          format: [],
          specialTargetGroup: [],
          financing: [],
        };
      }
      return filter;
    }),
  prjSortBy: z
    .enum(PROJECT_SORT_VALUES)
    .optional()
    .transform((sortBy) => {
      if (typeof sortBy === "undefined") {
        return PROJECT_SORT_VALUES[0];
      }
      return sortBy;
    }),
  prjPage: z
    .number()
    .optional()
    .transform((page) => {
      if (page === undefined) {
        return 1;
      }
      return page;
    }),
  prjAreaSearch: z
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
