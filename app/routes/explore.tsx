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
import { parseWithZod } from "@conform-to/zod-v1";

import { invariantResponse } from "~/lib/utils/response";

import { getOrganizationIds } from "./explore/organizations.server";

import { getEventIds } from "./explore/events.server";
import { getProjectIds } from "./explore/projects.server";
import { getFundingIds } from "./explore/fundings.server";
import { getFilterSchemes } from "./explore/all";
import { useEffect, useState } from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { EntitiesSelect } from "~/components-next/EntitiesSelect";

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
    origin: url.origin,
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

function Explore() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const [links, setLinks] = useState<
    { to: string; label: string; value: number; end?: boolean }[]
  >([]);
  const [currentLink, setCurrentLink] = useState(links[0]);

  useEffect(() => {
    const newLinks = [
      {
        to: "/explore/all",
        label: loaderData.locales.route.content.menu.allContent,
        value: loaderData.counts.allContent,
        end: true,
      },
      {
        to: "/explore/profiles",
        value: loaderData.counts.profiles,
        label: loaderData.locales.route.content.menu.profiles,
      },
      {
        to: "/explore/organizations",
        value: loaderData.counts.organizations,
        label: loaderData.locales.route.content.menu.organizations,
      },
      {
        to: "/explore/events",
        value: loaderData.counts.events,
        label: loaderData.locales.route.content.menu.events,
      },
      {
        to: "/explore/projects",
        value: loaderData.counts.projects,
        label: loaderData.locales.route.content.menu.projects,
      },
      {
        to: "/explore/fundings",
        value: loaderData.counts.fundings,
        label: loaderData.locales.route.content.menu.fundings,
      },
    ];
    setLinks(newLinks);
  }, [loaderData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const currentLink = links.find((link) => {
        return link.to === currentPath;
      });
      if (typeof currentLink !== "undefined") {
        setCurrentLink(currentLink);
      }
    }
  }, [links]);

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
                  origin={loaderData.origin}
                  {...currentLink}
                >
                  <EntitiesSelect.Menu.Item.Label>
                    {currentLink.label}{" "}
                    <EntitiesSelect.Badge>
                      {currentLink.value}
                    </EntitiesSelect.Badge>{" "}
                  </EntitiesSelect.Menu.Item.Label>
                </EntitiesSelect.Menu.Item>
              </EntitiesSelect.Label>
            )}
            <EntitiesSelect.Menu>
              {links.map((item) => {
                return (
                  <EntitiesSelect.Menu.Item
                    key={item.to}
                    {...item}
                    origin={loaderData.origin}
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

export default Explore;
