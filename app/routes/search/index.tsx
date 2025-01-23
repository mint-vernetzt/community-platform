import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
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
      return redirect(`/search/profiles?query=${queryString || ""}`);
    }
    // We have organization search results
    const organizationsCount = await countSearchedOrganizations({
      searchQuery,
      sessionUser,
      language,
    });
    if (organizationsCount !== 0) {
      return redirect(`/search/organizations?query=${queryString || ""}`);
    }
    // We have event search results
    const eventsCount = await countSearchedEvents({
      searchQuery,
      sessionUser,
      language,
    });
    if (eventsCount !== 0) {
      return redirect(`/search/events?query=${queryString || ""}`);
    }
    // We have project search results
    const projectsCount = await countSearchedProjects({
      searchQuery,
      sessionUser,
      language,
    });
    if (projectsCount !== 0) {
      return redirect(`/search/projects?query=${queryString || ""}`);
    }
    // We have funding search results
    const fundingsCount = await countSearchedFundings(searchQuery);
    if (fundingsCount !== 0) {
      return redirect(`/search/fundings?query=${queryString || ""}`);
    }
    // We have no search results
    return redirect(`/search/profiles?query=${queryString || ""}`);
  } else {
    return redirect(`/search/profiles?query=${queryString || ""}`);
  }
};
