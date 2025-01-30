import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useMatches,
  useRouteError,
  useRouteLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { captureRemixErrorBoundaryError } from "@sentry/remix";
import classNames from "classnames";
import * as React from "react";
import { ToastContainer } from "./components-next/ToastContainer";
import { getAlert } from "./alert.server";
import { createAuthClient, getSessionUser } from "./auth.server";
import { H1, H2 } from "./components/Heading/Heading";
import { RichText } from "./components/Richtext/RichText";
import { getEnv } from "./env.server";
import { detectLanguage, localeCookie } from "./i18n.server";
import { BlurFactor, getImageURL, ImageSizes } from "./images.server";
import { getFeatureAbilities } from "./lib/utils/application";
import { getProfileByUserId } from "./root.server";
import { NavBar } from "~/components-next/NavBar";
import { Footer } from "~/components-next/Footer";
import { LoginOrRegisterCTA } from "./components-next/LoginOrRegisterCTA";
import { MainMenu } from "./components-next/MainMenu";
import { getPublicURL } from "./storage.server";
import legacyStyles from "./styles/legacy-styles.css?url";
import { getToast } from "./toast.server";
import { combineHeaders, deriveMode } from "./utils.server";
import { defaultLanguage } from "./i18n.shared";
import { languageModuleMap } from "./locales/.server";
import { Link as StyledLink } from "@mint-vernetzt/components/src/molecules/Link";
import { Alert } from "@mint-vernetzt/components/src/molecules/Alert";
import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";
import { ModalRoot } from "./components-next/ModalRoot";
import { invariantResponse } from "./lib/utils/response";

export const meta: MetaFunction<typeof loader> = (args) => {
  const { data } = args;

  if (
    typeof data === "undefined" ||
    data === null ||
    typeof data.meta === "undefined" ||
    data.meta === null
  ) {
    return [
      { title: "MINTvernetzt Community Plattform" },
      {
        name: "description",
        property: "og:description",
        content:
          "Entdecke auf der MINTvernetzt Community-Plattform andere MINT-Akteur:innen, Organisationen und MINT-Veranstaltungen und lass Dich für Deine Arbeit inspirieren.",
      },
    ];
  }

  return [
    { title: "MINTvernetzt Community Plattform" },
    {
      name: "description",
      property: "og:description",
      content:
        "Entdecke auf der MINTvernetzt Community-Plattform andere MINT-Akteur:innen, Organisationen und MINT-Veranstaltungen und lass Dich für Deine Arbeit inspirieren.",
    },
    {
      name: "image",
      property: "og:image",
      content: data.meta.baseUrl + "/images/default-event-background.jpg",
    },
    {
      property: "og:image:secure_url",
      content: data.meta.baseUrl + "/images/default-event-background.jpg",
    },
    {
      property: "og:url",
      content: data.meta.url,
    },
  ];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: legacyStyles },
];

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const language = await detectLanguage(request);
  const languageCookieHeaders = {
    "Set-Cookie": await localeCookie.serialize(language),
  };
  const locales = languageModuleMap[language].root;

  const { authClient, headers } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["sharepic"]);

  const user = await getSessionUser(authClient);

  let sessionUserInfo;
  if (user !== null) {
    const profile = await getProfileByUserId(user.id);
    if (profile !== null) {
      const url = new URL(request.url);
      if (profile.termsAccepted === false && url.pathname !== "/accept-terms") {
        return redirect(`/accept-terms?redirect_to=${url.pathname}`);
      }
      let avatar = profile.avatar;
      let blurredAvatar;
      if (avatar !== null) {
        const publicURL = getPublicURL(authClient, avatar);
        if (publicURL !== null) {
          avatar = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Profile.NavBar.Avatar.width,
              height: ImageSizes.Profile.NavBar.Avatar.height,
            },
          });
          blurredAvatar = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Profile.NavBar.BlurredAvatar.width,
              height: ImageSizes.Profile.NavBar.BlurredAvatar.height,
            },
            blur: BlurFactor,
          });
        }
      }
      sessionUserInfo = {
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar,
        blurredAvatar,
      };
    } else {
      invariantResponse(false, "profile not found.", { status: 404 });
    }
  }

  const { alert, headers: alertHeaders } = await getAlert(request);
  const { toast, headers: toastHeaders } = await getToast(request);

  const mode = deriveMode(user);

  return data(
    {
      matomoUrl: process.env.MATOMO_URL,
      matomoSiteId: process.env.MATOMO_SITE_ID,
      sessionUserInfo,
      alert,
      toast,
      currentLanguage: language,
      locales,
      ENV: getEnv(),
      mode,
      abilities,
      meta: {
        baseUrl: process.env.COMMUNITY_BASE_URL,
        url: request.url,
      },
    },
    {
      headers: combineHeaders(
        headers,
        alertHeaders,
        toastHeaders,
        languageCookieHeaders
      ),
    }
  );
};

export const ErrorBoundary = () => {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);
  const rootLoaderData = useRouteLoaderData<typeof loader | null>("root");
  const hasRootLoaderData =
    typeof rootLoaderData !== "undefined" && rootLoaderData !== null;

  const [searchParams] = useSearchParams();
  const openNavBarMenuKey = "navbarmenu";
  const navBarMenuIsOpen = searchParams.get(openNavBarMenuKey);

  const bodyClasses = classNames(
    "mv-min-h-screen mv-break-words",
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
    <html
      lang={hasRootLoaderData ? rootLoaderData.currentLanguage : "de"}
      data-theme="light"
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>

      <body className={bodyClasses}>
        <div id="top" className="flex flex-col min-h-screen">
          <NavBar
            sessionUserInfo={
              hasRootLoaderData ? rootLoaderData.sessionUserInfo : undefined
            }
            openNavBarMenuKey={openNavBarMenuKey}
            locales={hasRootLoaderData ? rootLoaderData.locales : undefined}
          />
          <div className="mv-flex mv-h-full min-h-screen">
            <MainMenu
              mode={hasRootLoaderData ? rootLoaderData.mode : "anon"}
              openNavBarMenuKey={openNavBarMenuKey}
              username={
                hasRootLoaderData &&
                typeof rootLoaderData.sessionUserInfo !== "undefined"
                  ? rootLoaderData.sessionUserInfo.username
                  : undefined
              }
              abilities={
                hasRootLoaderData ? rootLoaderData.abilities : undefined
              }
              currentLanguage={
                hasRootLoaderData
                  ? rootLoaderData.currentLanguage
                  : defaultLanguage
              }
              locales={hasRootLoaderData ? rootLoaderData.locales : undefined}
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
              <Footer
                locales={hasRootLoaderData ? rootLoaderData.locales : undefined}
              />
            </div>
          </div>
        </div>
        <ScrollRestoration />
        {hasRootLoaderData ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(ENV)}`,
            }}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  );
};

export default function App() {
  const {
    matomoUrl,
    matomoSiteId,
    sessionUserInfo,
    alert,
    toast,
    currentLanguage,
    locales,
    mode,
    ENV,
    abilities,
  } = useLoaderData<typeof loader>();
  const location = useLocation();

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
  let isOrganizationSettings = false;
  if (matches[1] !== undefined) {
    isProjectSettings = matches[1].id === "routes/project/$slug/settings";
    isOrganizationSettings =
      matches[1].id === "routes/organization/$slug/settings";
    const otherSettingsRoutes = [
      "routes/profile/$username/settings",
      "routes/organization/$slug/settings",
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
    "mv-min-h-screen mv-break-words mv-antialiased",
    modal && "mv-overflow-hidden",
    showFilters !== null &&
      showFilters !== "false" &&
      "mv-overflow-hidden container-lg:mv-overflow-visible",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "mv-overflow-hidden xl:mv-overflow-visible"
  );

  const main = (
    <main className="mv-flex-auto mv-relative mv-w-full mv-bg-neutral-50">
      {alert !== null &&
      isNonAppBaseRoute === false &&
      isIndexRoute === false ? (
        <div className="mv-w-full mv-flex mv-justify-center">
          <div className="mv-w-full mv-max-w-screen-2xl mv-px-4 @lg:mv-px-8">
            <Alert level={alert.level}>
              {alert.isRichtext !== undefined && alert.isRichtext === true ? (
                <RichText html={alert.message} />
              ) : (
                alert.message
              )}
            </Alert>
          </div>
        </div>
      ) : null}
      <Outlet />
      {toast !== null ? <ToastContainer toast={toast} /> : null}
    </main>
  );

  // Scroll to top button
  // Should this be a component?
  const scrollButton = (
    <div className={`${isSettings ? "mv-hidden @md:mv-block " : ""}mv-w-0`}>
      <div className="mv-w-0 mv-h-4"></div>
      <div className="mv-w-0 mv-h-screen mv-sticky mv-top-0">
        <div className="mv-absolute mv-bottom-4 -mv-left-20">
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
    <html lang={currentLanguage} data-theme="light">
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
        <div className={bodyClasses}>
          <div id="top" className="mv-flex mv-flex-col mv-min-h-screen">
            <div
              className={`${
                showFilters ? "mv-hidden container-lg:mv-block " : " "
              }${
                isProjectSettings || isOrganizationSettings
                  ? "mv-hidden container-md:mv-block"
                  : ""
              }`}
            >
              <NavBar
                sessionUserInfo={sessionUserInfo}
                openNavBarMenuKey={openNavBarMenuKey}
                locales={locales}
              />
            </div>

            <div className="mv-flex mv-h-full mv-min-h-screen">
              <MainMenu
                mode={mode}
                openNavBarMenuKey={openNavBarMenuKey}
                username={sessionUserInfo?.username}
                abilities={abilities}
                currentLanguage={currentLanguage}
                locales={locales}
              />
              <div className="mv-flex-grow mv-@container">
                {isIndexRoute === false && isNonAppBaseRoute === false && (
                  <LoginOrRegisterCTA
                    isAnon={mode === "anon"}
                    locales={locales}
                  />
                )}
                <div className="mv-flex mv-flex-nowrap mv-min-h-[calc(100dvh - 76px)] xl:mv-min-h-[calc(100dvh - 80px)]">
                  {main}
                  {/* TODO: This should be rendered when the page content is smaller then the screen height. Not only on specific routes like nonAppBaseRoutes*/}
                  {scrollButton}
                </div>
                {isIndexRoute ? <Footer locales={locales} /> : null}
              </div>
            </div>
          </div>
          <ModalRoot />
        </div>
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
