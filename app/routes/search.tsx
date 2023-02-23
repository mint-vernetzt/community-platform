import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Search from "~/components/Search/Search";
import { H1 } from "~/components/Heading/Heading";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import {
  countSearchedEvents,
  countSearchedOrganizations,
  countSearchedProfiles,
  countSearchedProjects,
  getQueryValue,
} from "./search/utils.server";
import { event } from "cypress/types/jquery";

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "search");
  await getSessionUserOrThrow(authClient);

  const searchQuery = getQueryValue(request);

  let countData = {
    profiles: 0,
    organizations: 0,
    events: 0,
    projects: 0,
  };
  if (searchQuery !== null) {
    const [profilesCount, organizationsCount, eventsCount, projectsCount] =
      await Promise.all([
        countSearchedProfiles(searchQuery),
        countSearchedOrganizations(searchQuery),
        countSearchedEvents(searchQuery),
        countSearchedProjects(searchQuery),
      ]);
    countData.profiles = profilesCount;
    countData.organizations = organizationsCount;
    countData.events = eventsCount;
    countData.projects = projectsCount;
  }
  return json(
    {
      profilesCount: countData.profiles,
      organizationsCount: countData.organizations,
      eventsCount: countData.events,
      projectsCount: countData.projects,
    },
    { headers: response.headers }
  );
};

function SearchView() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");
  const getClassName = (active: boolean) =>
    `block text-lg font-semibold border-b text-primary ${
      active ? "border-b-primary" : "border-b-transparent"
    } hover:border-b-primary cursor-pointer`;
  return query !== null && query !== "" ? (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Deine Suche</H1>
        <p>Hier siehst Du die Ergebnisse zu Deiner Suche "{query}".</p>
      </section>
      <section className="container my-8 md:my-10" id="search-results">
        <ul
          className="flex flex-col md:flex-row flex-wrap justify-around text-center"
          id="search-result-tablist"
        >
          <NavLink
            id="profile-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`profiles?query=${query}`}
          >
            Profile (<>{loaderData.profilesCount}</>)
          </NavLink>
          <NavLink
            id="organization-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`organizations?query=${query}`}
          >
            Organisationen (<>{loaderData.organizationsCount}</>)
          </NavLink>
          <NavLink
            id="event-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`events?query=${query}`}
          >
            Veranstaltungen (<>{loaderData.eventsCount}</>)
          </NavLink>
          <NavLink
            id="project-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`projects?query=${query}`}
          >
            Projekte (<>{loaderData.projectsCount}</>)
          </NavLink>
        </ul>
      </section>
      <Outlet />
    </>
  ) : (
    <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
      <H1 like="h0">Suche</H1>
      <Form
        method="get"
        action="/search/profiles"
        onSubmit={(event) => {
          event.preventDefault();
          const query = event.target["search-query"].value;
          if (query.length >= 2) {
            window.location.href = `/search/profiles?query=${query}`;
          }
        }}
      >
        <Search id="search-query" autoFocus={true} />
      </Form>
    </section>
  );
}

export default SearchView;
