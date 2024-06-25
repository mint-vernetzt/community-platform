import {
  Alert,
  CircleButton,
  Footer,
  Link as StyledLink,
} from "@mint-vernetzt/components";
import type {
  LinksFunction,
  LoaderFunctionArgs,
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
  isRouteErrorResponse,
  useLoaderData,
  useLocation,
  useMatches,
  useRouteError,
  useSearchParams,
} from "@remix-run/react";
import { captureRemixErrorBoundaryError } from "@sentry/remix";
import classNames from "classnames";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next";
import { getFullName } from "~/lib/profile/getFullName";
import { getAlert } from "./alert.server";
import { createAuthClient, getSessionUser } from "./auth.server";
import { H1, H2 } from "./components/Heading/Heading";
import Search from "./components/Search/Search";
import { getImageURL } from "./images.server";
import { getInitials } from "./lib/profile/getInitials";
import { getFeatureAbilities } from "./lib/utils/application";
import { detectLanguage, getProfileByUserId } from "./root.server";
import {
  NavBarMenu,
  NextFooter,
  NextNavBar,
  Modal,
} from "./routes/__components";
import { initializeSentry } from "./sentry.client";
import { getPublicURL } from "./storage.server";
import legacyStyles from "./styles/legacy-styles.css";
import { combineHeaders, deriveMode } from "./utils.server";

// import newStyles from "../common/design/styles/styles.css";

export const meta: MetaFunction = () => {
  return [{ title: "MINTvernetzt Community Plattform" }];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: legacyStyles },
];

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const locale = detectLanguage(request);

  const { authClient, headers } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, [
    "events",
    "projects",
    "dashboard",
    "next_navbar",
    "abuse_report",
  ]);

  const user = await getSessionUser(authClient);

  let sessionUserInfo;
  let nextSessionUserInfo;

  if (user !== null) {
    // Refresh session to reset the cookie max age
    await authClient.auth.refreshSession();

    const profile = await getProfileByUserId(user.id);

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
      nextSessionUserInfo = {
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar,
      };
    } else {
      throw json({ message: "profile not found." }, { status: 404 });
    }
  }

  const { alert, headers: alertHeaders } = await getAlert(request);

  const mode = deriveMode(user);

  const env = {
    baseUrl: process.env.COMMUNITY_BASE_URL,
    sentryDsn: process.env.SENTRY_DSN,
  };

  return json(
    {
      matomoUrl: process.env.MATOMO_URL,
      matomoSiteId: process.env.MATOMO_SITE_ID,
      sessionUserInfo,
      nextSessionUserInfo,
      abilities,
      alert,
      locale,
      env,
      mode,
    },
    { headers: combineHeaders(headers, alertHeaders) }
  );
};

export const handle = {
  i18n: [
    "meta",
    "organisms/footer",
    "organisms/roadmap",
    "utils/social-media-services",
    "components/image-cropper",
    "organisms/cards/event-card",
    "organisms/cards/profile-card",
    "organisms/cards/organization-card",
  ],
};

export function HeaderLogo() {
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
        className="w-10 h-10 lg:w-auto lg:h-auto"
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
      <span className="hidden lg:block font-bold text-primary ml-2">
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
  const location = useLocation();

  const matches = useMatches();
  let isSettings = false;
  if (matches[1] !== undefined) {
    isSettings = matches[1].id === "routes/project/$slug/settings";
  }

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
                  className="dropdown-content menu shadow bg-base-100 rounded-box w-72 pb-4 z-20"
                >
                  <li className="relative p-4 pb-2 flex">
                    <a
                      href="#header"
                      className="w-4 h-4 p-0 items-center justify-center z-20 ml-auto focus:bg-white"
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
                      id="logout-form"
                      action="/logout?index"
                      method="post"
                      className="hidden"
                    />
                    <button
                      form="logout-form"
                      type="submit"
                      className="text-left w-full hover:bg-neutral-300 focus:bg-neutral-300"
                    >
                      {t("root.logout")}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex-initial h-10 w-1/2 xl:w-[150px] flex justify-end items-center lg:order-3">
              <Link
                to={`/login?login_redirect=${location.pathname}`}
                className="text-primary font-semibold hover:underline"
              >
                {t("root.login")}
              </Link>{" "}
              /{" "}
              <Link
                to={`/register?login_redirect=${location.pathname}`}
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

export const ErrorBoundary = () => {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);

  const { i18n } = useTranslation();

  let errorTitle;
  let errorText;
  let errorData;

  if (isRouteErrorResponse(error)) {
    errorTitle = `${error.status}`;
    errorText = error.statusText;
    errorData = `${error.data}`;
  } else if (error instanceof Error) {
    errorTitle = "Client error";
    errorText = error.message;
    errorData = error.stack;
  } else {
    errorTitle = "Unknown error";
  }

  return (
    <html lang="en-US" dir={i18n.dir()} data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>

      <body>
        <div id="top" className="flex flex-col min-h-screen">
          {/* TODO: Include NextNavBar */}
          {/* <NextNavBar abilities={{}} /> */}
          <NavBar abilities={{}} />
          <section className="container my-8 md:mt-10 lg:mt-20 text-center">
            <H1 like="h0">{errorTitle}</H1>
            <H2 like="h1">Sorry, something went wrong!</H2>
            <p>
              Please capture a screenshot and send it over to{" "}
              <StyledLink
                as="a"
                to="mailto:support@mint-vernetzt.de"
                variant="primary"
              >
                support@mint-vernetzt.de
              </StyledLink>
              . We will do our best to help you with this issue.
            </p>
          </section>
          {errorText !== undefined ? (
            <section className="container my-8 md:mt-10 lg:mt-20 text-center">
              <p>Error Text:</p>
              {errorText}
            </section>
          ) : null}
          {errorData !== undefined ? (
            <section className="container my-8 md:mt-10 lg:mt-20 text-center">
              <p>Error Data:</p>
              {errorData}
            </section>
          ) : null}
        </div>
        <Footer />

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
};

export default function App() {
  const location = useLocation();
  const {
    matomoUrl,
    matomoSiteId,
    sessionUserInfo: currentUserInfo,
    nextSessionUserInfo,
    abilities,
    alert,
    locale,
    env,
    mode,
  } = useLoaderData<typeof loader>();

  React.useEffect(() => {
    initializeSentry({ baseUrl: env.baseUrl, dsn: env.sentryDsn });
  }, [env.baseUrl, env.sentryDsn]);

  React.useEffect(() => {
    if (matomoSiteId !== undefined && window._paq !== undefined) {
      window._paq.push(["setCustomUrl", window.location.href]);
      window._paq.push(["trackPageView"]);
    }
  }, [location, matomoSiteId]);

  const nonAppBaseRoutes = ["/login", "/register", "/reset", "/auth/confirm"];
  const isNonAppBaseRoute = nonAppBaseRoutes.some((baseRoute) =>
    location.pathname.startsWith(baseRoute)
  );
  const isIndexRoute = location.pathname === "/";

  const matches = useMatches();
  let isSettings = false;
  let isProjectSettings = false;
  if (matches[1] !== undefined) {
    isProjectSettings = matches[1].id === "routes/project/$slug/settings";
    const otherSettingsRoutes = [
      "routes/profile/$username/settings",
      "routes/organization/$slug/settings",
      "routes/event/$slug/settings",
      "routes/project/$slug/settings",
    ];
    isSettings = otherSettingsRoutes.includes(matches[1].id);
  }

  const [searchParams] = useSearchParams();
  let modal = false;
  searchParams.forEach((value, key) => {
    if (key.startsWith("modal") && value !== "false") {
      modal = true;
    }
  });
  const showFilters = searchParams.get("showFilters");
  const openNavBarMenuKey = "navbarmenu";
  const navBarMenuIsOpen = searchParams.get(openNavBarMenuKey);

  const bodyClasses = classNames(
    modal && "mv-overflow-hidden",
    showFilters !== null &&
      showFilters !== "false" &&
      "mv-overflow-hidden lg:mv-overflow-auto",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "mv-overflow-hidden lg:mv-overflow-auto"
  );

  const { i18n } = useTranslation();
  useChangeLanguage(locale);

  const main = (
    <main
      className={`flex-auto relative w-full mv-py-6 @lg:mv-py-8 ${
        abilities.next_navbar.hasAccess ? "mv-bg-[#F8F9FA]" : ""
      }`}
    >
      {typeof alert !== "undefined" &&
      isNonAppBaseRoute === false &&
      isIndexRoute === false ? (
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1024px] @xl:mv-max-w-[1280px] @xl:mv-px-6 @2xl:mv-max-w-[1536px]">
          <Alert level={alert.level}>{alert.message}</Alert>
        </div>
      ) : null}
      <Outlet />
    </main>
  );

  // Scroll to top button
  // Should this be a component?
  const scrollButton = (
    <div className={`${isSettings ? "hidden @md:mv-block " : ""}w-0`}>
      <div className="w-0 h-16"></div>
      <div className="w-0 h-screen sticky top-0">
        <div className="absolute bottom-4 @md:mv-bottom-8 -left-20">
          <Link to={`${location.pathname}${location.search}#top`}>
            <CircleButton size="large" floating>
              <svg
                width="30"
                height="31"
                viewBox="0 0 30 31"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 4V29"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M3 13L15 2L27 13"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </CircleButton>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <html lang={locale} dir={i18n.dir()} data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        {typeof matomoSiteId !== "undefined" && matomoSiteId !== "" ? (
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

      <body className={bodyClasses}>
        <div id="top" className="flex flex-col min-h-screen">
          {abilities.next_navbar.hasAccess ? (
            <NextNavBar
              sessionUserInfo={nextSessionUserInfo}
              abilities={abilities}
              openNavBarMenuKey={openNavBarMenuKey}
            />
          ) : null}

          {isIndexRoute ||
          (showFilters !== null && showFilters !== "false") ||
          abilities.next_navbar.hasAccess ? null : (
            <NavBar sessionUserInfo={currentUserInfo} abilities={abilities} />
          )}
          {isIndexRoute && abilities.next_navbar.hasAccess === false ? (
            <div className="z-10">
              <NavBar sessionUserInfo={currentUserInfo} abilities={abilities} />
            </div>
          ) : null}

          <div className="mv-flex mv-h-full">
            {abilities.next_navbar.hasAccess ? (
              <NavBarMenu
                mode={mode}
                openNavBarMenuKey={openNavBarMenuKey}
                username={currentUserInfo?.username}
              />
            ) : null}
            <div className="mv-flex-grow mv-@container">
              <div className="flex flex-nowrap min-h-[calc(100dvh - 76px)] lg:min-h-[calc(100dvh - 80px)]">
                {main}
                {/* TODO: This should be rendered when the page content is smaller then the screen height. Not only on specific routes like nonAppBaseRoutes*/}
                {scrollButton}
              </div>
              {abilities.next_navbar.hasAccess && isIndexRoute ? (
                <NextFooter />
              ) : null}
            </div>
          </div>
          {abilities.next_navbar.hasAccess === false ? (
            <Footer isSettings={isProjectSettings} />
          ) : null}
        </div>
        <Modal.Root />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
