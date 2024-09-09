import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
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
import { useTranslation } from "react-i18next";

const i18nNS = ["routes/search"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchQuery = getQueryValueAsArrayOfWords(request);

  const { authClient } = await createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const countData = {
    profiles: 0,
    organizations: 0,
    events: 0,
    projects: 0,
    fundings: 0,
  };
  if (searchQuery !== null) {
    const [
      profilesCount,
      organizationsCount,
      eventsCount,
      projectsCount,
      fundingsCount,
    ] = await Promise.all([
      countSearchedProfiles(searchQuery, sessionUser),
      countSearchedOrganizations(searchQuery, sessionUser),
      countSearchedEvents(searchQuery, sessionUser),
      countSearchedProjects(searchQuery, sessionUser),
      countSearchedFundings(searchQuery),
    ]);
    countData.profiles = profilesCount;
    countData.organizations = organizationsCount;
    countData.events = eventsCount;
    countData.projects = projectsCount;
    countData.fundings = fundingsCount;
  }

  return json({
    profilesCount: countData.profiles,
    organizationsCount: countData.organizations,
    eventsCount: countData.events,
    projectsCount: countData.projects,
    fundingsCount: countData.fundings,
  });
};

function SearchView() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");
  const getClassName = (active: boolean) =>
    `block text-lg font-semibold border-b text-primary ${
      active ? "border-b-primary" : "border-b-transparent"
    } hover:border-b-primary cursor-pointer`;

  const { t } = useTranslation(i18nNS);

  return query !== null && query !== "" ? (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6 @md:mv-mb-16 mv-mt-5 @md:mv-mt-7 @lg:mv-mt-8 text-center">
        <H1 className="mv-mb-4 @md:mv-mb-2 @lg:mv-mb-3" like="h0">
          {t("title.query")}
        </H1>
        <p>{t("results", { query })}</p>
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
            {t("profiles")} (<>{loaderData.profilesCount}</>)
          </NavLink>
          <NavLink
            id="organization-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`organizations?query=${query}`}
            preventScrollReset
          >
            {t("organizations")} (<>{loaderData.organizationsCount}</>)
          </NavLink>
          <NavLink
            id="event-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`events?query=${query}`}
            preventScrollReset
          >
            {t("events")} (<>{loaderData.eventsCount}</>)
          </NavLink>
          <NavLink
            id="project-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`projects?query=${query}`}
            preventScrollReset
          >
            {t("projects")} (<>{loaderData.projectsCount}</>)
          </NavLink>
          <NavLink
            id="funding-tab"
            className={({ isActive }) => getClassName(isActive)}
            to={`fundings?query=${query}`}
            preventScrollReset
          >
            {t("fundings")} (<>{loaderData.fundingsCount}</>)
          </NavLink>
        </ul>
      </section>
      <Outlet />
    </>
  ) : (
    <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6 @md:mv-mb-16 mv-mt-5 @md:mv-mt-7 @lg:mv-mt-8 text-center">
      <H1 className="mv-mb-4 @md:mv-mb-2 @lg:mv-mb-3" like="h0">
        {t("title.noquery")}
      </H1>
      <Form
        method="get"
        action="/search/profiles"
        onSubmit={(event) => {
          event.preventDefault();
          // TODO: fix type issue
          // @ts-ignore
          const query = event.target["search-query"].value;
          if (query.length >= 2) {
            window.location.href = `/search?query=${query}`;
          }
        }}
      >
        <Search id="search-query" autoFocus={true} />
      </Form>
    </section>
  );
}

export default SearchView;
