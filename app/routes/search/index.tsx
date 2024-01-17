import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import {
  countSearchedEvents,
  countSearchedOrganizations,
  countSearchedProfiles,
  countSearchedProjects,
  getQuerySearchParam,
  getQueryValueAsArrayOfWords,
} from "./utils.server";

// handle first tab with search results as default route
export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const searchQuery = getQueryValueAsArrayOfWords(request);
  const queryString = getQuerySearchParam(request);

  const { authClient, response } = await createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (searchQuery !== null) {
    const profilesCount = await countSearchedProfiles(searchQuery, sessionUser);
    // We have profile search results
    if (profilesCount !== 0) {
      return redirect(`/search/profiles?query=${queryString || ""}`, {
        headers: response.headers,
      });
    }
    // We have organization search results
    const organizationsCount = await countSearchedOrganizations(
      searchQuery,
      sessionUser
    );
    if (organizationsCount !== 0) {
      return redirect(`/search/organizations?query=${queryString || ""}`, {
        headers: response.headers,
      });
    }
    // We have event search results
    const eventsCount = await countSearchedEvents(searchQuery, sessionUser);
    if (eventsCount !== 0) {
      return redirect(`/search/events?query=${queryString || ""}`, {
        headers: response.headers,
      });
    }
    // We have project search results
    const projectsCount = await countSearchedProjects(searchQuery, sessionUser);
    if (projectsCount !== 0) {
      return redirect(`/search/projects?query=${queryString || ""}`, {
        headers: response.headers,
      });
    }
    // We have no search results
    return redirect(`/search/profiles?query=${queryString || ""}`, {
      headers: response.headers,
    });
  } else {
    return redirect(`/search/profiles?query=${queryString || ""}`, {
      headers: response.headers,
    });
  }
};
