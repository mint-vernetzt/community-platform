import { parseWithZod } from "@conform-to/zod-v1";
import {
  type LoaderFunctionArgs,
  Outlet,
  useLoaderData,
  useSearchParams,
} from "react-router";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { getProfileIds } from "./explore/profiles.server";

import { invariantResponse } from "~/lib/utils/response";

import { getOrganizationIds } from "./explore/organizations.server";

import { createAuthClient, getSessionUser } from "~/auth.server";
import { EntitiesSelect } from "~/components-next/EntitiesSelect";
import { getFilterSchemes } from "./explore/all.shared";
import { getEventIds } from "./explore/events.server";
import { getFundingIds } from "./explore/fundings.server";
import { getProjectIds } from "./explore/projects.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["explore"];

  const submission = parseWithZod(searchParams, {
    schema: getFilterSchemes,
  });

  const { authClient } = await createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );

  const profileIds = await getProfileIds({
    filter: submission.value.prfFilter,
    search: submission.value.search,
    isLoggedIn,
    language,
  });
  const profileCount = profileIds.length;

  const organizationIds = await getOrganizationIds({
    filter: submission.value.orgFilter,
    search: submission.value.search,
    isLoggedIn,
    language,
  });
  const organizationCount = organizationIds.length;

  const eventIds = await getEventIds({
    filter: submission.value.evtFilter,
    search: submission.value.search,
    isLoggedIn,
    language,
  });
  const eventCount = eventIds.length;

  const projectIds = await getProjectIds({
    filter: submission.value.prjFilter,
    search: submission.value.search,
    isLoggedIn,
    language,
  });
  const projectCount = projectIds.length;

  const fundingIds = await getFundingIds({
    filter: submission.value.fndFilter,
    search: submission.value.search,
    sessionUser,
    language,
  });
  const fundingCount = fundingIds.length;

  const allContentCount =
    profileCount + organizationCount + eventCount + projectCount + fundingCount;

  return {
    locales,
    url: {
      pathname: url.pathname,
      search: url.search,
    },
    counts: {
      allContent: allContentCount,
      profiles: profileCount,
      organizations: organizationCount,
      events: eventCount,
      projects: projectCount,
      fundings: fundingCount,
    },
  };
}

export default function Explore() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const links = [
    {
      pathname: "/explore/all",
      search: loaderData.url.search,
      label: loaderData.locales.route.content.menu.allContent,
      value: loaderData.counts.allContent,
    },
    {
      pathname: "/explore/profiles",
      search: loaderData.url.search,
      value: loaderData.counts.profiles,
      label: loaderData.locales.route.content.menu.profiles,
    },
    {
      pathname: "/explore/organizations",
      search: loaderData.url.search,
      value: loaderData.counts.organizations,
      label: loaderData.locales.route.content.menu.organizations,
    },
    {
      pathname: "/explore/events",
      search: loaderData.url.search,
      value: loaderData.counts.events,
      label: loaderData.locales.route.content.menu.events,
    },
    {
      pathname: "/explore/projects",
      search: loaderData.url.search,
      value: loaderData.counts.projects,
      label: loaderData.locales.route.content.menu.projects,
    },
    {
      pathname: "/explore/fundings",
      search: loaderData.url.search,
      value: loaderData.counts.fundings,
      label: loaderData.locales.route.content.menu.fundings,
    },
  ];
  const currentLink = {
    pathname: loaderData.url.pathname,
    search: loaderData.url.search,
    label:
      loaderData.url.pathname === "/explore/all"
        ? loaderData.locales.route.content.menu.allContent
        : loaderData.url.pathname === "/explore/profiles"
        ? loaderData.locales.route.content.menu.profiles
        : loaderData.url.pathname === "/explore/organizations"
        ? loaderData.locales.route.content.menu.organizations
        : loaderData.url.pathname === "/explore/events"
        ? loaderData.locales.route.content.menu.events
        : loaderData.url.pathname === "/explore/projects"
        ? loaderData.locales.route.content.menu.projects
        : loaderData.url.pathname === "/explore/fundings"
        ? loaderData.locales.route.content.menu.fundings
        : loaderData.locales.route.content.menu.label,
    value:
      loaderData.url.pathname === "/explore/all"
        ? loaderData.counts.allContent
        : loaderData.url.pathname === "/explore/profiles"
        ? loaderData.counts.profiles
        : loaderData.url.pathname === "/explore/organizations"
        ? loaderData.counts.organizations
        : loaderData.url.pathname === "/explore/events"
        ? loaderData.counts.events
        : loaderData.url.pathname === "/explore/projects"
        ? loaderData.counts.projects
        : loaderData.url.pathname === "/explore/fundings"
        ? loaderData.counts.fundings
        : undefined,
  };

  return (
    <>
      <section className="mv-mx-auto @lg:mv-px-6 mv-max-w-screen-2xl mv-mb-8 @lg:mv-mb-16">
        <h1 className="mv-font-black mv-text-5xl mv-text-center mv-mt-4 mv-mb-8 mv-word-break-normal mv-px-4">
          {searchParams.has("search") && searchParams.get("search") !== ""
            ? insertParametersIntoLocale(
                loaderData.locales.route.content.searchHeadline,
                { search: searchParams.get("search") }
              )
            : loaderData.locales.route.content.headline}
        </h1>
        <div className="mv-flex mv-flex-col mv-gap-2 mv-items-center mv-justify-center @lg:mv-rounded-lg @lg:mv-border mv-border-neutral-200 mv-px-4 @lg:mv-bg-white">
          <EntitiesSelect>
            <EntitiesSelect.Menu.Label>
              {loaderData.locales.route.content.menu.label}
            </EntitiesSelect.Menu.Label>
            {typeof currentLink !== "undefined" && (
              <EntitiesSelect.Label>
                <EntitiesSelect.Menu.Item
                  {...currentLink}
                  isDropdownLabel={true}
                >
                  <EntitiesSelect.Menu.Item.Label>
                    {currentLink.label}{" "}
                    {typeof currentLink.value !== "undefined" ? (
                      <EntitiesSelect.Badge>
                        {currentLink.value}
                      </EntitiesSelect.Badge>
                    ) : null}{" "}
                  </EntitiesSelect.Menu.Item.Label>
                </EntitiesSelect.Menu.Item>
              </EntitiesSelect.Label>
            )}
            <EntitiesSelect.Menu>
              {links.map((item) => {
                return (
                  <EntitiesSelect.Menu.Item
                    key={`${item.pathname}${item.search}`}
                    {...item}
                  >
                    <EntitiesSelect.Menu.Item.Label>
                      {item.label}{" "}
                      <EntitiesSelect.Badge>{item.value}</EntitiesSelect.Badge>
                    </EntitiesSelect.Menu.Item.Label>
                  </EntitiesSelect.Menu.Item>
                );
              })}
            </EntitiesSelect.Menu>
          </EntitiesSelect>
        </div>
      </section>
      <Outlet />
    </>
  );
}
