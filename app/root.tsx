import {
  Alert,
  CircleButton,
  Link as StyledLink,
} from "@mint-vernetzt/components";
import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
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
import { getImageURL } from "./images.server";
import { getInitials } from "./lib/profile/getInitials";
import { getFeatureAbilities } from "./lib/utils/application";
import { detectLanguage, getProfileByUserId } from "./root.server";
import {
  LoginOrRegisterCTA,
  Modal,
  NavBarMenu,
  Footer,
  NavBar,
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
    "fundings",
    "abuse_report",
    "my_organizations",
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
      const url = new URL(request.url);
      if (profile.termsAccepted === false && url.pathname !== "/accept-terms") {
        return redirect(`/accept-terms?redirect_to=${url.pathname}`);
      }
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

export const ErrorBoundary = () => {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);

  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const openNavBarMenuKey = "navbarmenu";
  const navBarMenuIsOpen = searchParams.get(openNavBarMenuKey);

  const bodyClasses = classNames(
    "mv-min-h-screen",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "mv-overflow-hidden xl:mv-overflow-auto"
  );

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

      <body className={bodyClasses}>
        <div id="top" className="flex flex-col min-h-screen">
          <NavBar
            sessionUserInfo={undefined}
            openNavBarMenuKey={openNavBarMenuKey}
          />
          <div className="mv-flex mv-h-full min-h-screen">
            <NavBarMenu
              mode={"anon"}
              openNavBarMenuKey={openNavBarMenuKey}
              username={undefined}
              abilities={{}}
            />
            <div className="mv-flex-grow mv-@container min-h-screen">
              <div className="mv-min-h-screen">
                {/* Content */}
                <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl my-8 md:mt-10 lg:mt-20 text-center">
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
                  <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl my-8 md:mt-10 lg:mt-20 text-center">
                    <p>Error Text:</p>
                    {errorText}
                  </section>
                ) : null}
                {errorData !== undefined ? (
                  <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl my-8 md:mt-10 lg:mt-20 text-center">
                    <p>Error Data:</p>
                    {errorData}
                  </section>
                ) : null}
              </div>
              <Footer />
            </div>
          </div>
        </div>
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
    "mv-min-h-screen",
    modal && "mv-overflow-hidden",
    showFilters !== null &&
      showFilters !== "false" &&
      "mv-overflow-hidden container-lg:mv-overflow-auto",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "mv-overflow-hidden xl:mv-overflow-auto"
  );

  const { i18n } = useTranslation();
  useChangeLanguage(locale);

  const main = (
    <main className="flex-auto relative w-full mv-bg-neutral-50">
      {typeof alert !== "undefined" &&
      isNonAppBaseRoute === false &&
      isIndexRoute === false ? (
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
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
      <div className="w-0 h-4"></div>
      <div className="w-0 h-screen sticky top-0">
        <div className="absolute bottom-4 -left-20">
          <Link to={`${location.pathname}${location.search}#`}>
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
        <div id="top" className="flex flex-col mv-min-h-screen">
          <div
            className={`${
              showFilters ? "mv-hidden container-lg:mv-block " : " "
            }${isProjectSettings ? "mv-hidden container-md:mv-block" : ""}`}
          >
            <NavBar
              sessionUserInfo={nextSessionUserInfo}
              openNavBarMenuKey={openNavBarMenuKey}
            />
          </div>

          <div className="mv-flex mv-h-full mv-min-h-screen">
            <NavBarMenu
              mode={mode}
              openNavBarMenuKey={openNavBarMenuKey}
              username={currentUserInfo?.username}
              abilities={abilities}
            />
            <div className="mv-flex-grow mv-@container">
              {isIndexRoute === false && isNonAppBaseRoute === false && (
                <LoginOrRegisterCTA isAnon={mode === "anon"} />
              )}
              <div className="flex flex-nowrap min-h-[calc(100dvh - 76px)] xl:min-h-[calc(100dvh - 80px)]">
                {main}
                {/* TODO: This should be rendered when the page content is smaller then the screen height. Not only on specific routes like nonAppBaseRoutes*/}
                {scrollButton}
              </div>
              {isIndexRoute ? <Footer /> : null}
            </div>
          </div>
        </div>
        <Modal.Root />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
