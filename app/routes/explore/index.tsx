import { z } from "zod";
import { getEventsSchema } from "./events";
import { getFundingsSchema } from "./fundings";
import { getOrganizationsSchema } from "./organizations";
import { getProfilesSchema } from "./profiles";
import { getProjectsSchema } from "./projects";

const getSearchSchema = z.object({
  search: z
    .string()
    .optional()
    .transform((value) => {
      if (typeof value === "undefined") {
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

export const loader = async () => {
  return null;
};

function ExploreIndex() {
  return <h1>TEst</h1>;
}

export default ExploreIndex;
