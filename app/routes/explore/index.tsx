import { type z } from "zod";
import { getEventsSchema } from "./events";
import { getFundingsSchema } from "./fundings";
import { getOrganizationsSchema } from "./organizations";
import { getProfilesSchema } from "./profiles";
import { getProjectsSchema } from "./projects";

export const getFilterSchemes = getProfilesSchema
  .merge(getOrganizationsSchema)
  .merge(getEventsSchema)
  .merge(getProjectsSchema)
  .merge(getFundingsSchema);

export type FilterSchemes = z.infer<typeof getFilterSchemes>;

export const loader = async () => {
  return null;
};

function ExploreIndex() {
  return <h1>TEst</h1>;
}

export default ExploreIndex;
