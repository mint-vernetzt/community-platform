import type { LoaderFunction } from "@remix-run/node";
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
export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const queryString = getQuerySearchParam(request);

  const authClient = await createAuthClient(request, response);
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
    const eventsCount = await countSearchedEvents(searchQuery);
    if (eventsCount !== 0) {
      return redirect(`/search/events?query=${queryString || ""}`, {
        headers: response.headers,
      });
    }
    // We have project search results
    const projectsCount = await countSearchedProjects(searchQuery);
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
