import { Alert, Footer } from "@mint-vernetzt/components";
import type {
  DataFunctionArgs,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useMatches,
  useSearchParams,
} from "@remix-run/react";
import classNames from "classnames";
import * as React from "react";
import { notFound } from "remix-utils";
import { getFullName } from "~/lib/profile/getFullName";
import { type Alert as AlertType, getAlert } from "./alert.server";
import { createAuthClient, getSessionUser } from "./auth.server";
import Search from "./components/Search/Search";
import { getImageURL } from "./images.server";
import { getInitials } from "./lib/profile/getInitials";
import { getFeatureAbilities } from "./lib/utils/application";
import { getProfileByUserId } from "./root.server";
import { getPublicURL } from "./storage.server";
import styles from "./styles/legacy-styles.css";
import { combineHeaders } from "./utils.server";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next";
// import newStyles from "../common/design/styles/styles.css";

export const meta: MetaFunction = () => {
  const { t } = useTranslation(["meta"]);
  return { title: t("root.title", "MINTvernetzt Community Plattform") };
};

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export type RootRouteData = {
  matomoUrl: string | undefined;
  matomoSiteId: string | undefined;
  sessionUserInfo?: SessionUserInfo;
  abilities: Awaited<ReturnType<typeof getFeatureAbilities>>;
  alert: AlertType | undefined;
  locale: string;
};

export const loader = async (args: DataFunctionArgs) => {
  const { request } = args;
  const locale = await i18next.getLocale(request);
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const abilities = await getFeatureAbilities(authClient, [
    "events",
    "projects",
    "dashboard",
  ]);

  const sessionUser = await getSessionUser(authClient);

  let sessionUserInfo;

  if (sessionUser !== null) {
    const profile = await getProfileByUserId(sessionUser.id);

    let avatar: string | undefined;

    if (profile) {
      if (profile.avatar) {
        const publicURL = getPublicURL(authClient, profile.avatar);
        if (publicURL) {
          avatar = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
          });
        }
      }
      sessionUserInfo = {
        username: profile.username,
        initials: getInitials(profile),
        name: getFullName(profile),
        avatar,
      };
    } else {
      throw notFound({ message: "profile not found." });
    }
  }

  const { alert, headers: alertHeaders } = await getAlert(request);

  return json(
    {
      matomoUrl: process.env.MATOMO_URL,
      matomoSiteId: process.env.MATOMO_SITE_ID,
      sessionUserInfo,
      abilities,
      alert,
      locale,
    },
    { headers: combineHeaders(response.headers, alertHeaders) }
  );
};

export const handle = {
  i18n: [
    "meta",
    "organisms",
    "route/dashboard",
    "routes/imprint",
    "routes/index",
    "routes/login",
    "routes/explore/events",
    "routes/explore/organizations",
    "routes/explore/profiles",
    "routes/explore/projects",
    "routes/goodbye",
    "routes/organization/index",
    "routes/organization/create",
    "routes/profile/index",
    "routes/profile/settings",
    "routes/profile/settings/delete",
    "routes/profile/settings/general",
    "routes/profile/settings/notifications",
    "routes/profile/settings/security",
    "routes/register/index",
    "routes/reset/index",
    "routes/reset/confirm-email",
    "routes/reset/confirm-password",
    "routes/reset/set-email",
    "routes/reset/set-password",
    "routes/search",
    "routes/search/events",
    "routes/search/organizations",
    "routes/search/profiles",
    "routes/search/projects",
    "routes/upload/delete",
    "routes/upload/image",
  ],
};

function HeaderLogo() {
  const { t } = useTranslation(["meta"]);
  return (
    <div className="flex flex-row items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="56"
        height="56"
        viewBox="0 0 56 56"
        aria-describedby="mint-title-header"
        role="img"
        className="w-10 h-10 md:w-auto md:h-auto"
      >
        <title id="mint-title-header">{t("root.logo")}</title>
        <g fill="none">
          <path
            fill="#154194"
            d="M28 56c15.464 0 28-12.536 28-28S43.464 0 28 0 0 12.536 0 28s12.536 28 28 28"
          />
          <path
            fill="#EFE8E6"
            d="M41.354 25.24c-.43-.89-.998-1.614-1.703-2.17a6.664 6.664 0 0 0-2.447-1.202 11.356 11.356 0 0 0-2.916-.368c-1.358 0-2.532.174-3.524.524-.992.348-1.879.781-2.662 1.298a8.371 8.371 0 0 0-2.681-1.376 10.67 10.67 0 0 0-3.113-.446 14.397 14.397 0 0 0-3.973.543c-1.266.362-2.33.84-3.19 1.434-.523.362-.927.75-1.214 1.163-.288.414-.431.957-.431 1.628v11.98c0 1.085.26 1.816.783 2.19.522.374 1.37.562 2.545.562.573 0 1.096-.033 1.566-.097.47-.065.834-.136 1.096-.213V26.889c.355-.185.72-.347 1.096-.485a4.18 4.18 0 0 1 1.488-.252c.756 0 1.396.2 1.918.6.522.402.783 1.029.783 1.881v9.615c0 1.085.254 1.816.763 2.19.51.374 1.35.562 2.525.562.574 0 1.096-.033 1.566-.097.47-.065.848-.136 1.135-.213V27.897c0-.26-.026-.52-.078-.776a4.99 4.99 0 0 1 1.233-.697 3.95 3.95 0 0 1 1.468-.272c.809 0 1.449.2 1.918.6.47.402.705 1.029.705 1.881v9.615c0 1.085.255 1.816.763 2.19.51.374 1.351.562 2.526.562.573 0 1.096-.033 1.566-.097A9.51 9.51 0 0 0 42 40.69V28.478c0-1.266-.215-2.345-.646-3.237v-.001Z"
          />
          <path
            fill="#B16FAB"
            d="M18.967 17.982C19.612 18.66 20.457 19 21.5 19s1.887-.34 2.532-1.018c.645-.679.968-1.513.968-2.503 0-.961-.323-1.782-.968-2.46-.645-.68-1.49-1.019-2.532-1.019-1.044 0-1.888.34-2.533 1.018-.645.68-.967 1.5-.967 2.46 0 .991.322 1.825.967 2.504m12 0C31.612 18.66 32.457 19 33.5 19s1.887-.34 2.532-1.018c.645-.679.968-1.513.968-2.503 0-.961-.323-1.782-.968-2.46-.645-.68-1.49-1.019-2.532-1.019-1.044 0-1.888.34-2.533 1.018-.645.68-.967 1.5-.967 2.46 0 .991.322 1.825.967 2.504"
          />
        </g>
      </svg>
      <span className="hidden md:block font-bold text-primary ml-2">
        {t("root.community")}
      </span>
    </div>
  );
}

type NavBarProps = {
  sessionUserInfo?: SessionUserInfo;
  abilities: Awaited<ReturnType<typeof getFeatureAbilities>>;
};

type SessionUserInfo = {
  username: string;
  initials: string;
  name?: string;
  avatar?: string;
};

function NavBar(props: NavBarProps) {
  const closeDropdown = () => {
    if (document.activeElement !== null) {
      // TODO: can this type assertion be proofen by code?
      // f.e. with below if statement
      //if (document.activeElement instanceof HTMLAnchorElement) {
      (document.activeElement as HTMLAnchorElement).blur();
      //}
    }
  };

  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");

  const matches = useMatches();
  const isSettings = matches[1].id === "routes/next/project/$slug/settings";

  const classes = classNames("shadow-md mb-8", isSettings && "hidden md:block");

  const { t } = useTranslation(["meta"]);

  return (
    <header id="header" className={classes}>
      <div className="container relative">
        <div className="pt-3 md:pb-3 flex flex-row flex-wrap xl:flex-nowrap md:items-center xl:justify-between">
          <div className="flex-initial w-1/2 xl:w-[150px] xl:order-1">
            <Link
              to={
                props.sessionUserInfo !== undefined &&
                props.abilities["dashboard"].hasAccess === true
                  ? "/dashboard"
                  : "/"
              }
            >
              <HeaderLogo />
            </Link>
          </div>

          <div className="flex-initial w-full xl:w-auto order-last xl:order-2 flex flex-col lg:flex-row lg:flex-nowrap items-center justify-center">
            <ul className="flex pt-3 lg:pt-0 w-full lg:w-auto justify-between sm:justify-center text-sm sm:text-base">
              <li className="px-2 md:px-5">
                <Link
                  to="/explore/profiles"
                  className="font-semibold text-primary inline-block border-y border-transparent hover:border-b-primary md:leading-7 pb-2 md:pb-0"
                >
                  {t("root.profiles")}
                </Link>
              </li>
              <li className="px-2 md:px-5">
                <Link
                  to="/explore/organizations"
                  className="font-semibold text-primary inline-block border-y border-transparent hover:border-b-primary md:leading-7 pb-2 md:pb-0"
                >
                  {t("root.organizations")}
                </Link>
              </li>
              <li className="px-2 md:px-5">
                <Link
                  to="/explore/events"
                  className="font-semibold text-primary inline-block border-y border-transparent hover:border-b-primary md:leading-7 pb-2 md:pb-0"
                >
                  {t("root.events")}
                </Link>
              </li>
              <li className="px-2 md:px-5">
                <Link
                  to="/explore/projects"
                  className="font-semibold text-primary inline-block border-y border-transparent hover:border-b-primary md:leading-7 pb-2 md:pb-0"
                >
                  {t("root.projects")}
                </Link>
              </li>
            </ul>
            <div className="flex-initial w-full lg:w-auto order-last lg:order-2 py-3 lg:py-0 lg:px-5 ">
              <Form method="get" action="/search">
                <Search
                  placeholder={t("root.search.placeholder")}
                  name="query"
                  query={query}
                />
              </Form>
            </div>
          </div>

          {/* TODO: link to login on anon*/}
          {props.sessionUserInfo !== undefined ? (
            <div className="flex-initial h-10 w-1/2 xl:w-[250px] flex justify-end items-center xl:order-3">
              <div className="dropdown dropdown-end">
                <label
                  tabIndex={0}
                  className="flex items-center cursor-pointer nowrap"
                >
                  <span className="mr-4 font-semibold text-primary hidden md:block">
                    {props.sessionUserInfo.name}
                  </span>
                  {props.sessionUserInfo.avatar === undefined ? (
                    <div className="text-sm w-10 h-10 font-semibold bg-primary text-white flex items-center justify-center rounded-full overflow-hidden">
                      {props.sessionUserInfo.initials}
                    </div>
                  ) : (
                    <div className="cursor-pointer w-10 h-10 rounded-full">
                      <img
                        src={props.sessionUserInfo.avatar}
                        alt={props.sessionUserInfo.initials}
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                  )}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu shadow bg-base-100 rounded-box w-72 pb-4"
                >
                  <li className="relative p-4 pb-2 flex">
                    <a
                      href="#header"
                      className="w-4 h-4 p-0 items-center justify-center z-10 ml-auto focus:bg-white"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1.29199 1.292C1.38488 1.19888 1.49523 1.12499 1.61672 1.07458C1.73821 1.02416 1.86845 0.998215 1.99999 0.998215C2.13152 0.998215 2.26176 1.02416 2.38325 1.07458C2.50474 1.12499 2.6151 1.19888 2.70799 1.292L7.99999 6.586L13.292 1.292C13.385 1.19903 13.4953 1.12527 13.6168 1.07495C13.7383 1.02464 13.8685 0.998738 14 0.998738C14.1315 0.998738 14.2617 1.02464 14.3832 1.07495C14.5046 1.12527 14.615 1.19903 14.708 1.292C14.801 1.38498 14.8747 1.49536 14.925 1.61683C14.9754 1.73831 15.0012 1.86851 15.0012 2C15.0012 2.13149 14.9754 2.26169 14.925 2.38317C14.8747 2.50465 14.801 2.61503 14.708 2.708L9.41399 8L14.708 13.292C14.801 13.385 14.8747 13.4954 14.925 13.6168C14.9754 13.7383 15.0012 13.8685 15.0012 14C15.0012 14.1315 14.9754 14.2617 14.925 14.3832C14.8747 14.5046 14.801 14.615 14.708 14.708C14.615 14.801 14.5046 14.8747 14.3832 14.925C14.2617 14.9754 14.1315 15.0013 14 15.0013C13.8685 15.0013 13.7383 14.9754 13.6168 14.925C13.4953 14.8747 13.385 14.801 13.292 14.708L7.99999 9.414L2.70799 14.708C2.61501 14.801 2.50463 14.8747 2.38315 14.925C2.26168 14.9754 2.13147 15.0013 1.99999 15.0013C1.8685 15.0013 1.7383 14.9754 1.61682 14.925C1.49534 14.8747 1.38496 14.801 1.29199 14.708C1.19901 14.615 1.12526 14.5046 1.07494 14.3832C1.02462 14.2617 0.998723 14.1315 0.998723 14C0.998723 13.8685 1.02462 13.7383 1.07494 13.6168C1.12526 13.4954 1.19901 13.385 1.29199 13.292L6.58599 8L1.29199 2.708C1.19886 2.61511 1.12497 2.50476 1.07456 2.38327C1.02415 2.26178 0.998199 2.13154 0.998199 2C0.998199 1.86847 1.02415 1.73822 1.07456 1.61673C1.12497 1.49524 1.19886 1.38489 1.29199 1.292Z"
                          fill="#454C5C"
                        />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <h5 className="px-4 py-0 mb-3 text-xl text-primary font-bold hover:bg-white">
                      {t("root.myProfile")}
                    </h5>
                  </li>
                  <li>
                    <Link
                      to={`/profile/${props.sessionUserInfo.username}`}
                      className="py-2 hover:bg-neutral-300 focus:bg-neutral-300"
                      onClick={closeDropdown}
                    >
                      {t("root.showProfile")}
                    </Link>
                  </li>
                  <li className="p-4 pb-6">
                    <hr className="divide-y divide-neutral-400 hover:bg-white m-0 p-0" />
                  </li>
                  <li>
                    <h5 className="px-4 py-0 mb-3 text-xl text-primary font-bold hover:bg-white">
                      {t("root.myOrganizations")}
                    </h5>
                  </li>
                  <li>
                    <Link
                      to={`/profile/${props.sessionUserInfo.username}#organizations`}
                      className="py-2 hover:bg-neutral-300 focus:bg-neutral-300"
                      onClick={closeDropdown}
                    >
                      {t("root.showOrganizations")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/organization/create`}
                      className="py-2 hover:bg-neutral-300 focus:bg-neutral-300"
                      onClick={closeDropdown}
                    >
                      {t("root.createOrganization")}
                    </Link>
                  </li>

                  <>
                    <li className="p-4 pb-6">
                      <hr className="divide-y divide-neutral-400 hover:bg-white m-0 p-0" />
                    </li>
                    <li>
                      <h5 className="px-4 py-0 mb-3 text-xl text-primary font-bold hover:bg-white">
                        {t("root.myEvents")}
                      </h5>
                    </li>
                    <li>
                      <Link
                        to={`/profile/${props.sessionUserInfo.username}#events`}
                        className="py-2 hover:bg-neutral-300 focus:bg-neutral-300"
                        onClick={closeDropdown}
                      >
                        {t("root.showEvents")}
                      </Link>
                    </li>
                    {props.abilities.events !== undefined &&
                    props.abilities.events.hasAccess === true ? (
                      <li>
                        <Link
                          to={`/event/create`}
                          className="py-2 hover:bg-neutral-300 focus:bg-neutral-300"
                          onClick={closeDropdown}
                        >
                          {t("root.createEvent")}
                        </Link>
                      </li>
                    ) : null}
                  </>
                  <li className="p-4 pb-6">
                    <hr className="divide-y divide-neutral-400 hover:bg-white m-0 p-0" />
                  </li>
                  <li>
                    <h5 className="px-4 py-0 mb-3 text-xl text-primary font-bold hover:bg-white">
                      {t("root.myProjects")}
                    </h5>
                  </li>
                  <li>
                    <Link
                      to={`/profile/${props.sessionUserInfo.username}#projects`}
                      className="py-2 hover:bg-neutral-300 focus:bg-neutral-300"
                      onClick={closeDropdown}
                    >
                      {t("root.showProjects")}
                    </Link>
                  </li>
                  {props.abilities.projects !== undefined &&
                  props.abilities.projects.hasAccess === true ? (
                    <li>
                      <Link
                        to={`/project/create`}
                        className="py-2 hover:bg-neutral-300 focus:bg-neutral-300"
                        onClick={closeDropdown}
                      >
                        {t("root.createProject")}
                      </Link>
                    </li>
                  ) : null}
                  <li className="p-4">
                    <hr className="divide-y divide-neutral-400 hover:bg-white m-0 p-0" />
                  </li>
                  <li>
                    <Form
                      action="/logout?index"
                      method="post"
                      className="py-2 hover:bg-neutral-300 focus:bg-neutral-300 rounded-none"
                    >
                      <button type="submit" className="w-full text-left">
                        {t("root.logout")}
                      </button>
                    </Form>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex-initial h-10 w-1/2 xl:w-[150px] flex justify-end items-center lg:order-3">
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                {t("root.login")}
              </Link>{" "}
              /{" "}
              <Link
                to="/register"
                className="text-primary font-semibold hover:underline"
              >
                {t("root.register")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const location = useLocation();
  const {
    matomoUrl,
    matomoSiteId,
    sessionUserInfo: currentUserInfo,
    abilities,
    alert,
  } = useLoaderData<typeof loader>();

  React.useEffect(() => {
    if (matomoSiteId !== undefined && window._paq !== undefined) {
      window._paq.push(["setCustomUrl", window.location.href]);
      window._paq.push(["trackPageView"]);
    }
  }, [location, matomoSiteId]);

  const nonAppBaseRoutes = ["/login", "/register", "/reset"];
  const isNonAppBaseRoute = nonAppBaseRoutes.some((baseRoute) =>
    location.pathname.startsWith(baseRoute)
  );
  const isIndexRoute = location.pathname === "/";

  const matches = useMatches();
  const isSettings = matches[1].id === "routes/next/project/$slug/settings";

  const { locale } = useLoaderData<typeof loader>();

  const { i18n } = useTranslation();
  useChangeLanguage(locale);

  return (
    <html lang={locale} dir={i18n.dir()} data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        {matomoSiteId !== undefined ? (
          <script
            async
            dangerouslySetInnerHTML={{
              __html: `
                var _paq = window._paq = window._paq || [];
                _paq.push(['enableLinkTracking']);
                (function() {
                  var u="${matomoUrl}";
                  _paq.push(['setTrackerUrl', u+'matomo.php']);
                  _paq.push(['setSiteId', '${matomoSiteId}']);
                  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                  g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
                })();
              `,
            }}
          />
        ) : null}
      </head>

      <body>
        <div className="flex flex-col min-h-screen">
          {isNonAppBaseRoute || isIndexRoute ? null : (
            <NavBar sessionUserInfo={currentUserInfo} abilities={abilities} />
          )}
          {isIndexRoute ? (
            <div className="z-10">
              <NavBar sessionUserInfo={currentUserInfo} abilities={abilities} />
            </div>
          ) : null}
          <main className="flex-auto relative pb-24 md:pb-8">
            {typeof alert !== "undefined" &&
            isNonAppBaseRoute === false &&
            isIndexRoute === false ? (
              <div className="container">
                <Alert level={alert.level}>{alert.message}</Alert>
              </div>
            ) : null}
            <Outlet />
          </main>
          <Footer isSettings={isSettings} />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
