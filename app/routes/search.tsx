import type { LoaderFunctionArgs } from "react-router";
import {
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  useSearchParams,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import Search from "~/components/Search/Search";
import {
  countSearchedEvents,
  countSearchedFundings,
  countSearchedOrganizations,
  countSearchedProfiles,
  countSearchedProjects,
  getQueryValueAsArrayOfWords,
} from "./search/utils.server";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/i18n.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { prismaClient } from "~/prisma.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchQuery = getQueryValueAsArrayOfWords(request);

  const { authClient } = await createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["search"];

  const countData = {
    profiles: 0,
    organizations: 0,
    events: 0,
    projects: 0,
    fundings: 0,
  };
  if (searchQuery !== null) {
    if (searchQuery.length === 0) {
      countData.profiles = 0;
      countData.organizations = 0;
      countData.events = 0;
      countData.projects = 0;
      countData.fundings = 0;
    } else {
      const queries = [
        countSearchedProfiles({ searchQuery, sessionUser, language }),
        countSearchedOrganizations({ searchQuery, sessionUser, language }),
        countSearchedEvents({ searchQuery, sessionUser, language }),
        countSearchedProjects({ searchQuery, sessionUser, language }),
        countSearchedFundings(searchQuery),
      ];
      const [
        profilesCount,
        organizationsCount,
        eventsCount,
        projectsCount,
        fundingsCount,
      ] = await prismaClient.$transaction(queries);
      countData.profiles = profilesCount;
      countData.organizations = organizationsCount;
      countData.events = eventsCount;
      countData.projects = projectsCount;
      countData.fundings = fundingsCount;
    }
  }

  return {
    profilesCount: countData.profiles,
    organizationsCount: countData.organizations,
    eventsCount: countData.events,
    projectsCount: countData.projects,
    fundingsCount: countData.fundings,
    locales,
  };
};

function SearchView() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");
  const getClassName = (active: boolean) =>
    `block text-lg font-semibold border-b text-primary ${
      active ? "border-b-primary" : "border-b-transparent"
    } hover:border-b-primary cursor-pointer`;

  return query !== null && query !== "" ? (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6 @md:mv-mb-16 mv-mt-5 @md:mv-mt-7 @lg:mv-mt-8 text-center">
        <H1 className="mv-mb-4 @md:mv-mb-2 @lg:mv-mb-3" like="h0">
          {locales.title.query}
        </H1>
        <p>
          {insertParametersIntoLocale(locales.results, {
            query,
          })}
        </p>
      </section>
      <section
        className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-10 @md:mv-mb-20"
        id="search-results"
      >
        <ul
          className="flex flex-col @md:mv-flex-row flex-wrap justify-around text-center"
          id="search-result-tablist"
        >
          <NavLink
            id="profile-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`profiles?query=${query}`}
            preventScrollReset
          >
            {locales.profiles} (<>{loaderData.profilesCount}</>)
          </NavLink>
          <NavLink
            id="organization-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`organizations?query=${query}`}
            preventScrollReset
          >
            {locales.organizations} (<>{loaderData.organizationsCount}</>)
          </NavLink>
          <NavLink
            id="event-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`events?query=${query}`}
            preventScrollReset
          >
            {locales.events} (<>{loaderData.eventsCount}</>)
          </NavLink>
          <NavLink
            id="project-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`projects?query=${query}`}
            preventScrollReset
          >
            {locales.projects} (<>{loaderData.projectsCount}</>)
          </NavLink>
          <NavLink
            id="funding-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`fundings?query=${query}`}
            preventScrollReset
          >
            {locales.fundings} (<>{loaderData.fundingsCount}</>)
          </NavLink>
        </ul>
      </section>
      <Outlet />
    </>
  ) : (
    <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6 @md:mv-mb-16 mv-mt-5 @md:mv-mt-7 @lg:mv-mt-8 text-center">
      <H1 className="mv-mb-4 @md:mv-mb-2 @lg:mv-mb-3" like="h0">
        {locales.title.noquery}
      </H1>
      <Form className="mv-flex-grow" method="get" action="/search">
        <Search placeholder={locales.placeholder} name="query" query={query} />
      </Form>
    </section>
  );
}

export default SearchView;
