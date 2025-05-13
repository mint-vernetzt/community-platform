import { z } from "zod";
import { getEventsSchema } from "./events";
import { getFundingsSchema } from "./fundings";
import { getOrganizationsSchema } from "./organizations";
import { getProfilesSchema } from "./profiles";
import { getProjectsSchema } from "./projects";
import { type LoaderFunctionArgs, redirect } from "react-router";
import { parseWithZod } from "@conform-to/zod-v1";
import { invariantResponse } from "~/lib/utils/response";
import { getAllProjects } from "./projects.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { createAuthClient, getSessionUser } from "~/auth.server";

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

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const showFiltersValue = searchParams.getAll("showFilters");
  if (showFiltersValue.length > 0) {
    const cleanURL = new URL(request.url);
    cleanURL.searchParams.delete("showFilters");
    cleanURL.searchParams.append("showFilters", "on");
    return redirect(cleanURL.toString(), { status: 301 });
  }

  const submission = parseWithZod(searchParams, {
    schema: getFilterSchemes,
  });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["explore"].all;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const numberOfEntities = 4;

  const projects = await getAllProjects({
    filter: submission.value.prjFilter,
    sortBy: submission.value.prjSortBy,
    search: submission.value.search,
    sessionUser,
    take: numberOfEntities,
    language,
  });

  return {
    projects,
    locales,
  };
};

function ExploreIndex() {
  return <h1>TEst</h1>;
}

export default ExploreIndex;
