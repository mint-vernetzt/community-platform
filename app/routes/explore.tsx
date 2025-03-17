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

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["explore"];

  const url = new URL(request.url);

  return {
    locales,
    origin: url.origin,
  };
}

function Explore() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const links = [
    {
      to: "/explore",
      label: loaderData.locales.route.content.menu.allContent,
      end: true,
    },
    {
      to: "/explore/profiles",
      label: loaderData.locales.route.content.menu.profiles,
    },
    {
      to: "/explore/organizations",
      label: loaderData.locales.route.content.menu.organizations,
    },
    {
      to: "/explore/events",
      label: loaderData.locales.route.content.menu.events,
    },
    {
      to: "/explore/projects",
      label: loaderData.locales.route.content.menu.projects,
    },
    {
      to: "/explore/fundings",
      label: loaderData.locales.route.content.menu.fundings,
    },
  ];

  return (
    <>
      <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-flex mv-flex-col mv-gap-2 mv-items-center mv-justify-center mv-rounded-lg mv-bg-white mv-border mv-border-neutral-200 mv-p-6">
          <h1 className="mv-font-black mv-text-5xl">
            {searchParams.has("search") && searchParams.get("search") !== ""
              ? insertParametersIntoLocale(
                  loaderData.locales.route.content.searchHeadline,
                  { search: searchParams.get("search") }
                )
              : loaderData.locales.route.content.headline}
          </h1>
          <menu className="mv-flex mv-gap-2 mv-p mv-rounded-lg mv-bg-neutral-100 mv-flex-wrap mv-justify-center mv-font-semibold mv-text-sm">
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
}) {
  const { label, origin, ...otherProps } = props;

  const [searchParams] = useSearchParams();
  const match = useMatch(props.to);

  const url = new URL(props.to, origin);
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
      ? " mv-text-primary mv-bg-primary-50"
      : " mv-text-neutral-600 mv-bg-neutral-200"
  );

  return (
    <li className="mv-p-2">
      <NavLink className={linkClasses} {...otherProps}>
        {label}
        <span className={badgeClasses}>100</span>
      </NavLink>
    </li>
  );
}

export default Explore;
