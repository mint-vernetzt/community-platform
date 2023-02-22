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
import InputText from "~/components/FormElements/InputText/InputText";
import { H1 } from "~/components/Heading/Heading";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import {
  countSearchedEvents,
  countSearchedOrganizations,
  countSearchedProfiles,
  countSearchedProjects,
  getQueryValue,
} from "./search/utils.server";

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

function Search() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");
  const getClassName = (active: boolean) =>
    `block text-3xl ${
      active
        ? "text-primary border-b-primary"
        : "text-neutral-500 border-transparent"
    }  hover:text-primary py-3 border-y hover:border-b-primary cursor-pointer`;
  return (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Suche</H1>
        <Form method="get" action="/search/profiles">
          <InputText
            id="query"
            label=""
            defaultValue={query || undefined}
            placeholder="Suche mit min. zwei Buchstaben"
            centered={true}
            // TODO: auto select input value
            autoFocus={true}
          />
          <input hidden name="page" defaultValue={1} readOnly />
          <button
            id="submitButton"
            type="submit"
            className="btn btn-primary mt-2"
          >
            Suchen
          </button>
        </Form>
      </section>
      {query !== null ? (
        <>
          <section className="container my-8 md:my-10" id="search-results">
            <ul
              className="flex flex-col md:flex-row flex-wrap justify-around text-center"
              id="search-result-tablist"
            >
              <NavLink
                id="profile-tab"
                className={({ isActive }) => getClassName(isActive)}
                to={`profiles?page=1&query=${query}`}
              >
                Profile (<>{loaderData.profilesCount}</>)
              </NavLink>
              <NavLink
                id="organization-tab"
                className={({ isActive }) => getClassName(isActive)}
                to={`organizations?page=1&query=${query}`}
              >
                Organisationen (<>{loaderData.organizationsCount}</>)
              </NavLink>
              <NavLink
                id="event-tab"
                className={({ isActive }) => getClassName(isActive)}
                to={`events?page=1&query=${query}`}
              >
                Veranstaltungen (<>{loaderData.eventsCount}</>)
              </NavLink>
              <NavLink
                id="project-tab"
                className={({ isActive }) => getClassName(isActive)}
                to={`projects?page=1&query=${query}`}
              >
                Projekte (<>{loaderData.projectsCount}</>)
              </NavLink>
            </ul>
          </section>
          <Outlet />
        </>
      ) : null}
    </>
  );
}

export default Search;
