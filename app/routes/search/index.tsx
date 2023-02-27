import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
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
  const authClient = createAuthClient(request, response);
  await getSessionUserOrThrow(authClient);

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const queryString = getQuerySearchParam(request);

  if (searchQuery !== null) {
    const profilesCount = await countSearchedProfiles(searchQuery);
    // We have profile search results
    if (profilesCount !== 0) {
      return redirect(`/search/profiles?query=${queryString || ""}`, {
        headers: response.headers,
      });
    }
    // We have organization search results
    const organizationsCount = await countSearchedOrganizations(searchQuery);
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
