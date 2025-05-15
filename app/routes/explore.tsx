import classNames from "classnames";
import {
  type LoaderFunctionArgs,
  NavLink,
  Outlet,
  useLoaderData,
  useMatch,
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
import { getFilterSchemes } from "./explore/index";
import { createContext, useContext, useEffect, useState } from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";

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
        to: "/explore",
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
        <h1 className="mv-font-black mv-text-5xl mv-text-center mv-mt-4 mv-mb-8 mv-word-break-normal">
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
                    {currentLink.label} <Badge>{currentLink.value}</Badge>{" "}
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
                      {item.label} <Badge>{item.value}</Badge>
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

const EntitiesSelectMenuItemContext =
  createContext<DropDownMenuItemProps | null>(null);

function useIsActive() {
  const context = useContext(EntitiesSelectMenuItemContext);
  if (context === null) {
    throw new Error(
      "useIsActive must be used within a EntitiesSelectMenuItemContext"
    );
  }
  const { to } = context;
  const match = useMatch(to);
  return match !== null;
}

function Badge(props: React.PropsWithChildren) {
  const isActive = useIsActive();

  const classes = classNames(
    "mv-text-xs mv-font-semibold mv-leading-4 mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-h-4 mv-px-2.5 mv-rounded-lg",
    "mv-text-white mv-bg-primary",
    isActive
      ? "@lg:mv-text-primary @lg:mv-bg-white"
      : "@lg:mv-bg-primary-50 @lg:mv-text-primary"
  );
  return <span className={classes}>{props.children}</span>;
}

type DropDownMenuItemProps = React.PropsWithChildren & {
  to: string;
  origin: string;
  end?: boolean;
};

function EntitiesSelectDropdownItem(props: DropDownMenuItemProps) {
  const { to, origin, children, ...otherProps } = props;

  const [searchParams] = useSearchParams();
  const match = useMatch(to);

  const url = new URL(to, origin);

  url.search = searchParams.toString();
  url.searchParams.delete("prfAreaSearch");
  url.searchParams.delete("orgAreaSearch");
  url.searchParams.delete("evtAreaSearch");
  url.searchParams.delete("prjAreaSearch");

  const isActive = match !== null;

  const classes = classNames(
    "mv-w-full",
    "mv-text-base mv-font-semibold",
    "mv-whitespace-normal",
    "mv-flex mv-gap-2 mv-items-center",
    "mv-grow mv-min-w-fit"
  );

  const linkClasses = classNames(
    "mv-w-full @lg:mv-max-w-content",
    "hover:mv-bg-gray-100 focus-within:mv-bg-gray-100"
  );

  return (
    <EntitiesSelectMenuItemContext.Provider
      value={{ to, origin, end: otherProps.end }}
    >
      {isActive ? (
        <li className={classes}>{children}</li>
      ) : (
        <li className={classes}>
          <NavLink className={linkClasses} {...otherProps} to={url.toString()}>
            {children}
          </NavLink>
        </li>
      )}
    </EntitiesSelectMenuItemContext.Provider>
  );
}

function EntitiesSelectDropdownItemLabel(props: React.PropsWithChildren) {
  const isActive = useIsActive();

  const classes = classNames(
    "mv-w-full",
    "mv-flex mv-gap-2 mv-items-center",
    "mv-mx-4 my-2 @lg:mv-mx-0",
    "@lg:mv-px-4 @lg:mv-py-2",
    isActive
      ? "@lg:mv-bg-primary @lg:mv-text-white @lg:mv-border-transparent"
      : "@lg:mv-bg-white mv-text-neutral-700",
    "@lg:mv-rounded-lg @lg:mv-border @lg:mv-border-neutral-200",
    "mv-text-base @lg:mv-text-sm mv-font-semibold",
    "mv-whitespace-normal"
  );

  return <span className={classes}>{props.children}</span>;
}

function EntitiesSelectLabel(props: React.PropsWithChildren) {
  const classes = classNames(
    "mv-w-full mv-py-1 mv-pr-4",
    "mv-inline-flex @lg:mv-hidden mv-items-center mv-justify-between mv-cursor-pointer",
    "mv-bg-neutral-50 mv-rounded-lg mv-border mv-border-neutral-200",
    "group-has-[:focus-within]/dropdown-label:mv-bg-gray-100",
    "group-has-[:focus-within]/dropdown-label:mv-border-blue-500 group-has-[:focus-within]/dropdown-label:mv-ring-1 group-has-[:focus-within]/dropdown-label:mv-ring-blue-500"
  );

  return (
    <div className="mv-group/dropdown-label">
      <label className={classes}>
        {props.children}
        <input type="checkbox" className="mv-h-0 mv-w-0 mv-opacity-0" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className="mv-rotate-90 group-has-[:checked]:-mv-rotate-90 mv-shrink-0"
        >
          <path
            fill="currentColor"
            fillRule="nonzero"
            d="M6.147 15.854a.5.5 0 0 1 0-.708L11.794 9.5 6.147 3.855a.5.5 0 1 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0v-.001Z"
          ></path>
        </svg>
      </label>
    </div>
  );
}

function EntitiesSelectDropdownLabel(props: React.PropsWithChildren) {
  return (
    <p className="mv-block @lg:mv-hidden mv-mb-2 mv-text-sm mv-font-semibold mv-text-neutral-500">
      {props.children}
    </p>
  );
}

function EntitiesSelectDropdown(props: React.PropsWithChildren) {
  const classes = classNames(
    "mv-w-full @lg:mv-max-w-full",
    "mv-mt-2 @lg:mv-m-0 @lg:mv-py-2 @lg:mv-px-2",
    "mv-hidden group-has-[:checked]:mv-flex @lg:mv-inline-flex @lg:mv-overflow-scroll",
    "mv-flex-col @lg:mv-flex-row",
    "mv-gap-2 @lg:mv-gap-6",
    // "mv-bg-white @lg:mv-bg-neutral-100",
    "mv-border mv-rounded-lg mv-border-neutral-200 @lg:rounded-lg @lg:mv-border-0"
  );

  return <menu className={classes}>{props.children}</menu>;
}

function EntitiesSelect(props: React.PropsWithChildren) {
  const classes = classNames("mv-group mv-peer", "mv-w-full @lg:mv-max-w-fit");

  return <div className={classes}>{props.children}</div>;
}

EntitiesSelect.Menu = EntitiesSelectDropdown;
EntitiesSelectDropdown.Item = EntitiesSelectDropdownItem;
EntitiesSelectDropdown.Label = EntitiesSelectDropdownLabel;
EntitiesSelectDropdownItem.Label = EntitiesSelectDropdownItemLabel;
EntitiesSelect.Label = EntitiesSelectLabel;

export default Explore;
