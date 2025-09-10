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
      discipline: z.array(z.string().trim()),
      additionalDiscipline: z.array(z.string().trim()),
      projectTargetGroup: z.array(z.string().trim()),
      area: z.array(z.string().trim()),
      format: z.array(z.string().trim()),
      specialTargetGroup: z.array(z.string().trim()),
      financing: z.array(z.string().trim()),
    })
    .optional()
    .transform((filter) => {
      if (typeof filter === "undefined") {
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
      if (typeof page === "undefined") {
        return 1;
      }
      return page;
    }),
  showFilters: z.boolean().optional(),
});
