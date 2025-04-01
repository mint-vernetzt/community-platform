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
import { getProfilesCount } from "./explore/profiles.server";
import { parseWithZod } from "@conform-to/zod-v1";
import { getProfilesSchema } from "./explore/profiles";
import { invariantResponse } from "~/lib/utils/response";
import { getOrganizationsSchema } from "./explore/organizations";
import { getOrganizationsCount } from "./explore/organizations.server";
import { getEventsSchema } from "./explore/events";
import { getFundingsSchema } from "./explore/fundings";
import { getProjectsSchema } from "./explore/projects";
import { getEventsCount } from "./explore/events.server";
import { getProjectsCount } from "./explore/projects.server";
import { getFundingsCount } from "./explore/fundings.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["explore"];

  const profilesSubmission = parseWithZod(searchParams, {
    schema: getProfilesSchema,
  });
  const organizationSubmission = parseWithZod(searchParams, {
    schema: getOrganizationsSchema,
  });
  const eventSubmission = parseWithZod(searchParams, {
    schema: getEventsSchema,
  });
  const projectSubmission = parseWithZod(searchParams, {
    schema: getProjectsSchema,
  });
  const fundingSubmission = parseWithZod(searchParams, {
    schema: getFundingsSchema,
  });

  invariantResponse(
    profilesSubmission.status === "success" &&
      organizationSubmission.status === "success" &&
      eventSubmission.status === "success" &&
      projectSubmission.status === "success" &&
      fundingSubmission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );

  const profileCount = await getProfilesCount({
    filter: profilesSubmission.value.prfFilter,
  });

  const organizationCount = await getOrganizationsCount({
    filter: organizationSubmission.value.orgFilter,
  });
  const eventCount = await getEventsCount({
    filter: eventSubmission.value.evtFilter,
  });
  const projectCount = await getProjectsCount({
    filter: projectSubmission.value.prjFilter,
  });
  const fundingCount = await getFundingsCount({
    filter: fundingSubmission.value.fndFilter,
  });
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

  const links = [
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

  return (
    <>
      <section className="mv-mx-auto @sm:mv-pt-8 @sm:mv-pb-16 @sm:mv-px-4 @xl:mv-px-6 mv-max-w-screen-2xl">
        <div className="mv-flex mv-flex-col mv-gap-2 mv-items-center mv-justify-center @sm:mv-rounded-lg mv-bg-white @sm:mv-border mv-border-neutral-200 mv-p-6">
          <h1 className="mv-font-black mv-text-5xl">
            {searchParams.has("search") && searchParams.get("search") !== ""
              ? insertParametersIntoLocale(
                  loaderData.locales.route.content.searchHeadline,
                  { search: searchParams.get("search") }
                )
              : loaderData.locales.route.content.headline}
          </h1>
          <menu className="mv-inline-flex mv-overflow-scroll mv-max-w-full mv-gap-2 mv-p mv-rounded-lg mv-bg-neutral-100 mv-font-semibold mv-text-sm">
            {links.map((item) => {
              return (
                <MenuItem key={item.to} {...item} origin={loaderData.origin} />
              );
            })}
          </menu>
        </div>
      </section>
      <Outlet />
    </>
  );
}

function MenuItem(props: {
  to: string;
  label: string;
  end?: boolean;
  origin: string;
  value: number;
}) {
  const { label, to, origin, ...otherProps } = props;

  const [searchParams] = useSearchParams();
  const match = useMatch(to);

  const url = new URL(to, origin);
  url.search = searchParams.toString();

  const isActive = match !== null;

  const linkClasses = classNames(
    "mv-flex mv-gap-2 mv-items-center",
    "mv-px-4 mv-py-2 mv-rounded-lg",
    isActive ? "mv-bg-primary-500 mv-text-white" : "mv-bg-white"
  );

  const badgeClasses = classNames(
    "mv-text-xs mv-font-semibold mv-leading-4 mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-h-fit mv-py-0.5 mv-px-2.5 mv-rounded-lg",
    isActive
      ? " mv-text-primary mv-bg-white"
      : " mv-text-neutral-600 mv-bg-neutral-200"
  );

  return (
    <li className="mv-p-2 mv-grow mv-min-w-fit">
      <NavLink className={linkClasses} {...otherProps} to={url.toString()}>
        {label}
        <span className={badgeClasses}>{props.value}</span>
      </NavLink>
    </li>
  );
}

export default Explore;
