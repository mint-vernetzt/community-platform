import { Alert } from "@mint-vernetzt/components/src/molecules/Alert";
import { Link as StyledLink } from "@mint-vernetzt/components/src/molecules/Link";
import { captureException } from "@sentry/react";
import classNames from "classnames";
import { useEffect } from "react";
import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useMatches,
  useRouteError,
  useRouteLoaderData,
  useSearchParams,
} from "react-router";
import { Footer } from "~/components-next/Footer";
import { NavBar } from "~/components-next/NavBar";
import { getAlert } from "./alert.server";
import { createAuthClient, getSessionUser } from "./auth.server";
import { LoginOrRegisterCTA } from "./components-next/LoginOrRegisterCTA";
import { MainMenu } from "./components-next/MainMenu";
import { ModalRoot } from "./components-next/ModalRoot";
import { ScrollToTopButton } from "./components-next/ScrollToTopButton";
import { ToastContainer } from "./components-next/ToastContainer";
import { H1, H2 } from "./components/Heading/Heading";
import { RichText } from "./components/Richtext/RichText";
import { getEnv } from "./env.server";
import { detectLanguage, localeCookie } from "./i18n.server";
import { DEFAULT_LANGUAGE } from "./i18n.shared";
import { BlurFactor, getImageURL, ImageSizes } from "./images.server";
import { invariantResponse } from "./lib/utils/response";
import { languageModuleMap } from "./locales/.server";
import { useNonce } from "./nonce-provider";
import { getProfileByUserId, getTagsBySearchQuery } from "./root.server";
import { getPublicURL } from "./storage.server";
import styles from "./styles/styles.css?url";
import { getToast } from "./toast.server";
import { combineHeaders, deriveMode } from "./utils.server";

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

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const language = await detectLanguage(request);
  const languageCookieHeaders = {
    "Set-Cookie": await localeCookie.serialize(language),
  };
  const locales = languageModuleMap[language].root;

  const { authClient, headers } = createAuthClient(request);

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

  const searchParams = new URL(request.url).searchParams;
  const searchQuery = searchParams.get("search");

  const tags =
    searchQuery !== null
      ? await getTagsBySearchQuery(searchQuery, language)
      : [];

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
      meta: {
        baseUrl: process.env.COMMUNITY_BASE_URL,
        url: request.url,
      },
      tags,
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
  const isResponse = isRouteErrorResponse(error);
  const nonce = useNonce();

  if (typeof document !== "undefined") {
    console.error(error);
  }

  useEffect(() => {
    // TODO: see sentry.server.ts for details
    // For now the response errors are also tracked via client sentry because sentry does not yet support rr7
    // if (isResponse) {
    //   return;
    // }
    try {
      // When client side error occurs and sentry is not working, we send the error to the server
      captureException(error);
    } catch (error) {
      console.warn("Sentry Sentry.captureException failed");
      const stringifiedError = JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      );
      fetch(`/error?error=${encodeURIComponent(stringifiedError)}`, {
        method: "GET",
      });
    }
  }, [error, isResponse]);

  const rootLoaderData = useRouteLoaderData<typeof loader | null>("root");
  const hasRootLoaderData =
    typeof rootLoaderData !== "undefined" && rootLoaderData !== null;

  const [searchParams] = useSearchParams();
  const openMainMenuKey = "mainMenu";
  const mainMenuIsOpen = searchParams.get(openMainMenuKey);

  const bodyClasses = classNames(
    "mv-flex mv-min-h-dvh mv-break-words mv-antialiased mv-overflow-x-hidden",
    mainMenuIsOpen !== null &&
      mainMenuIsOpen !== "false" &&
      "mv-overflow-y-hidden xl:mv-overflow-y-visible"
  );

  let errorTitle;
  let errorText;
  let errorData;

  if (isResponse) {
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

      <body id="top" className={bodyClasses}>
        <MainMenu
          mode={hasRootLoaderData ? rootLoaderData.mode : "anon"}
          openMainMenuKey={openMainMenuKey}
          username={
            hasRootLoaderData &&
            typeof rootLoaderData.sessionUserInfo !== "undefined"
              ? rootLoaderData.sessionUserInfo.username
              : undefined
          }
          currentLanguage={
            hasRootLoaderData
              ? rootLoaderData.currentLanguage
              : DEFAULT_LANGUAGE
          }
          locales={hasRootLoaderData ? rootLoaderData.locales : undefined}
        />
        <div
          className={`mv-flex mv-flex-col mv-w-full mv-@container mv-relative ${
            mainMenuIsOpen === null || mainMenuIsOpen === "false"
              ? ""
              : "mv-hidden xl:mv-block"
          }`}
        >
          <NavBar
            sessionUserInfo={
              hasRootLoaderData ? rootLoaderData.sessionUserInfo : undefined
            }
            openMainMenuKey={openMainMenuKey}
            locales={hasRootLoaderData ? rootLoaderData.locales : undefined}
          />
          <main className="mv-w-full mv-h-full @md:mv-bg-neutral-50">
            {/* Content */}
            <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-my-8 md:mv-mt-10 lg:mv-mt-20 mv-text-center">
              <H1 like="h0">{errorTitle}</H1>
              <H2 like="h1">Sorry, something went wrong!</H2>
              <p>
                Please capture a screenshot and send it over to{" "}
                <StyledLink
                  as="link"
                  to="mailto:support@mint-vernetzt.de"
                  variant="primary"
                >
                  support@mint-vernetzt.de
                </StyledLink>
                . We will do our best to help you with this issue.
              </p>
            </section>
            {errorText !== undefined ? (
              <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-my-8 md:mv-mt-10 lg:mv-mt-20 mv-text-center">
                <p>Error Text:</p>
                {errorText}
              </section>
            ) : null}
            {errorData !== undefined ? (
              <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-my-8 md:mv-mt-10 lg:mv-mt-20 mv-text-center">
                <p>Error Data:</p>
                {errorData}
              </section>
            ) : null}
          </main>
        </div>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
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
  } = useLoaderData<typeof loader>();
  const location = useLocation();
  const nonce = useNonce();

  useEffect(() => {
    if (matomoSiteId !== "" && matomoUrl !== "") {
      try {
        const _paq = (window._paq = window._paq || []);
        _paq.push(["enableLinkTracking"]);
        _paq.push(["setTrackerUrl", `${matomoUrl}matomo.php`]);
        _paq.push(["setSiteId", matomoSiteId]);
        const matomoScriptElement = document.createElement("script");
        const firstScriptElement = document.getElementsByTagName("script")[0];
        matomoScriptElement.async = true;
        matomoScriptElement.src = `${matomoUrl}matomo.js`;
        matomoScriptElement.nonce = nonce;
        if (
          firstScriptElement !== null &&
          firstScriptElement.parentNode !== null
        ) {
          firstScriptElement.parentNode.insertBefore(
            matomoScriptElement,
            firstScriptElement
          );
        } else {
          throw new Error(
            "Matomo script element could not be inserted into the DOM."
          );
        }
      } catch (error) {
        console.warn(`Matomo initialization failed.`);
        const stringifiedError = JSON.stringify(
          error,
          Object.getOwnPropertyNames(error)
        );
        fetch(`/error?error=${encodeURIComponent(stringifiedError)}`, {
          method: "GET",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (matomoSiteId !== "" && matomoUrl !== "" && window._paq !== undefined) {
      try {
        window._paq.push(["setCustomUrl", window.location.href]);
        window._paq.push(["trackPageView"]);
      } catch (error) {
        console.warn(`Matomo tracking failed.`);
        const stringifiedError = JSON.stringify(
          error,
          Object.getOwnPropertyNames(error)
        );
        fetch(`/error?error=${encodeURIComponent(stringifiedError)}`, {
          method: "GET",
        });
      }
    }
  }, [location, matomoSiteId, matomoUrl]);

  const nonAppBaseRoutes = [
    "/login",
    "/register",
    "/reset",
    "/auth/confirm",
    "/auth/request-confirmation",
  ];
  const isNonAppBaseRoute = nonAppBaseRoutes.some((baseRoute) =>
    location.pathname.startsWith(baseRoute)
  );
  const isIndexRoute = location.pathname === "/";
  const isMapOnExplore = location.pathname === "/explore/organizations/map";

  const matches = useMatches();
  let isSettings = false;
  let isProjectSettings = false;
  let isOrganizationSettings = false;
  let isDashboard = false;
  let isExplore = false;
  let isMap = false;
  if (matches[1] !== undefined) {
    isProjectSettings = matches[1].id === "routes/project/$slug/settings";
    isOrganizationSettings =
      matches[1].id === "routes/organization/$slug/settings";
    isDashboard = matches[1].id === "routes/dashboard";
    isExplore = matches[1].id === "routes/explore";
    const otherSettingsRoutes = [
      "routes/profile/$username/settings",
      "routes/organization/$slug/settings",
      "routes/organization/$slug/settings",
      "routes/event/$slug/settings",
      "routes/project/$slug/settings",
    ];
    isSettings = otherSettingsRoutes.includes(matches[1].id);
    isMap = matches[1].id === "routes/map";
  }

  const [searchParams] = useSearchParams();
  let modal = false;
  searchParams.forEach((value, key) => {
    if (key.startsWith("modal") && value !== "false") {
      modal = true;
    }
  });
  let overlayMenu = false;
  searchParams.forEach((value, key) => {
    if (key.startsWith("overlay-menu") && value !== "false") {
      overlayMenu = true;
    }
  });
  const showFilters = searchParams.get("showFilters");
  const openMainMenuKey = "mainMenu";
  const mainMenuIsOpen = searchParams.get(openMainMenuKey);

  const bodyClasses = classNames(
    "mv-flex mv-min-h-dvh mv-break-words mv-antialiased mv-overflow-x-hidden",
    modal && "mv-overflow-y-hidden",
    overlayMenu && "mv-overflow-y-hidden container-lg:mv-overflow-y-visible",
    showFilters !== null &&
      showFilters === "on" &&
      "mv-overflow-y-hidden container-lg:mv-overflow-y-visible",
    mainMenuIsOpen !== null &&
      mainMenuIsOpen !== "false" &&
      "mv-overflow-y-hidden xl:mv-overflow-y-visible"
  );

  return (
    <html lang={currentLanguage} data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>

      <body id="top" className={bodyClasses}>
        {isMap === false ? (
          <>
            <div
              inert={modal ? true : undefined}
              className={
                mainMenuIsOpen
                  ? "mv-w-full xl:mv-w-fit"
                  : "mv-hidden xl:mv-block"
              }
            >
              <MainMenu
                mode={mode}
                openMainMenuKey={openMainMenuKey}
                username={sessionUserInfo?.username}
                currentLanguage={currentLanguage}
                locales={locales}
              />
            </div>
            <div
              inert={modal ? true : undefined}
              className={`mv-flex mv-flex-col mv-w-full mv-@container mv-relative ${
                mainMenuIsOpen === null || mainMenuIsOpen === "false"
                  ? ""
                  : "mv-hidden xl:mv-block"
              }`}
            >
              <div
                className={`${showFilters ? "mv-hidden @lg:mv-block " : ""}${
                  isProjectSettings || isOrganizationSettings
                    ? "mv-hidden @md:mv-block "
                    : ""
                }mv-sticky mv-top-0 mv-z-30`}
              >
                <NavBar
                  sessionUserInfo={sessionUserInfo}
                  openMainMenuKey={openMainMenuKey}
                  locales={locales}
                  hideSearchBar={
                    isDashboard
                      ? {
                          untilScrollY: 570,
                          afterBreakpoint: "@md",
                        }
                      : isExplore
                      ? {
                          untilScrollY: 274,
                          afterBreakpoint: "@lg",
                        }
                      : undefined
                  }
                />
              </div>
              {isIndexRoute === false && isNonAppBaseRoute === false && (
                <div
                  className={`${
                    isProjectSettings || isOrganizationSettings
                      ? "mv-hidden @md:mv-block "
                      : ""
                  }${showFilters ? "mv-hidden @lg:mv-block" : ""}`}
                >
                  <LoginOrRegisterCTA
                    isAnon={mode === "anon"}
                    locales={locales}
                  />
                </div>
              )}
              <div className="mv-flex mv-flex-nowrap mv-w-full">
                <main className="mv-w-full @md:mv-bg-neutral-50">
                  <Outlet />
                </main>
                <div
                  className={`${isSettings ? "mv-hidden @md:mv-block " : ""}${
                    showFilters === "true" && isMapOnExplore === false
                      ? "mv-hidden @lg:mv-block "
                      : ""
                  }${isMapOnExplore ? "mv-hidden " : ""}mv-w-0`}
                >
                  <ScrollToTopButton locales={locales} />
                </div>
              </div>
              {isIndexRoute ? <Footer locales={locales} mode={mode} /> : null}
              {alert !== null ? (
                <Alert level={alert.level}>
                  {alert.isRichtext !== undefined &&
                  alert.isRichtext === true ? (
                    <RichText html={alert.message} />
                  ) : (
                    alert.message
                  )}
                </Alert>
              ) : null}
              {toast !== null ? <ToastContainer toast={toast} /> : null}
            </div>
            <ModalRoot />
          </>
        ) : (
          <Outlet />
        )}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}
