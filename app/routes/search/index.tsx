import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import {
  countSearchedEvents,
  countSearchedFundings,
  countSearchedOrganizations,
  countSearchedProfiles,
  countSearchedProjects,
  getQuerySearchParam,
  getQueryValueAsArrayOfWords,
} from "./utils.server";
import { detectLanguage } from "~/i18n.server";

// handle first tab with search results as default route
export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const searchQuery = getQueryValueAsArrayOfWords(request);
  const queryString = getQuerySearchParam(request);

  const { authClient } = await createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (searchQuery !== null) {
    const language = await detectLanguage(request);
    const profilesCount = await countSearchedProfiles({
      searchQuery,
      sessionUser,
      language,
    });
    // We have profile search results
    if (profilesCount !== 0) {
      const newUrl = new URL(
        `${process.env.COMMUNITY_BASE_URL}/search/profiles`
      );
      newUrl.searchParams.append("query", queryString || "");
      return redirect(newUrl.toString());
    }
    // We have organization search results
    const organizationsCount = await countSearchedOrganizations({
      searchQuery,
      sessionUser,
      language,
    });
    if (organizationsCount !== 0) {
      const newUrl = new URL(
        `${process.env.COMMUNITY_BASE_URL}/search/organizations`
      );
      newUrl.searchParams.append("query", queryString || "");
      return redirect(newUrl.toString());
    }
    // We have event search results
    const eventsCount = await countSearchedEvents({
      searchQuery,
      sessionUser,
      language,
    });
    if (eventsCount !== 0) {
      const newUrl = new URL(`${process.env.COMMUNITY_BASE_URL}/search/events`);
      newUrl.searchParams.append("query", queryString || "");
      return redirect(newUrl.toString());
    }
    // We have project search results
    const projectsCount = await countSearchedProjects({
      searchQuery,
      sessionUser,
      language,
    });
    if (projectsCount !== 0) {
      const newUrl = new URL(
        `${process.env.COMMUNITY_BASE_URL}/search/projects`
      );
      newUrl.searchParams.append("query", queryString || "");
      return redirect(newUrl.toString());
    }
    // We have funding search results
    const fundingsCount = await countSearchedFundings(searchQuery);
    if (fundingsCount !== 0) {
      const newUrl = new URL(
        `${process.env.COMMUNITY_BASE_URL}/search/fundings`
      );
      newUrl.searchParams.append("query", queryString || "");
      return redirect(newUrl.toString());
    }
    // We have no search results
    const newUrl = new URL(`${process.env.COMMUNITY_BASE_URL}/search/profiles`);
    newUrl.searchParams.append("query", queryString || "");
    return redirect(newUrl.toString());
  } else {
    const newUrl = new URL(`${process.env.COMMUNITY_BASE_URL}/search/profiles`);
    newUrl.searchParams.append("query", queryString || "");
    return redirect(newUrl.toString());
  }
};
