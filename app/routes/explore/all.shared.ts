import { z } from "zod";
import { getProfilesSchema } from "./profiles.shared";
import { getOrganizationsSchema } from "./organizations.shared";
import { getEventsSchema } from "./events.shared";
import { getProjectsSchema } from "./projects.shared";
import { getFundingsSchema } from "./fundings.shared";

const getSearchSchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (typeof value === "undefined" || value === "") {
        return [];
      }
      const words = value.split(" ").filter((word) => {
        return word.length > 0;
      });
      return words;
    }),
});

export type GetSearchSchema = z.infer<typeof getSearchSchema>;

export const getFilterSchemes = getProfilesSchema
  .merge(getOrganizationsSchema)
  .merge(getEventsSchema)
  .merge(getProjectsSchema)
  .merge(getFundingsSchema)
  .merge(getSearchSchema);

export type FilterSchemes = z.infer<typeof getFilterSchemes>;
