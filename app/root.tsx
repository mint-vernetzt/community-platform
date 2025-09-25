import { Alert } from "@mint-vernetzt/components/src/molecules/Alert";
import { Link as StyledLink } from "@mint-vernetzt/components/src/molecules/Link";
import { captureException } from "@sentry/react";
import classNames from "classnames";
import { useEffect } from "react";
import type {
  HeadersArgs,
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
import {
  getEntitiesBySearchQuery,
  getProfileByUserId,
  getTagsBySearchQuery,
} from "./root.server";
import { getPublicURL } from "./storage.server";
import { getToast } from "./toast.server";
import { combineHeaders, deriveMode } from "./utils.server";
import {
  viewCookie,
  viewCookieSchema,
} from "./routes/explore/organizations.server";
import "./app.css";

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

export const headers = ({ loaderHeaders }: HeadersArgs) => {
  return loaderHeaders;
};

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
  const entities =
    searchQuery !== null ? await getEntitiesBySearchQuery(searchQuery) : [];

  const enhancedEntities = entities.map((entity) => {
    let logo = entity.logo;
    let blurredLogo;
    if (typeof logo !== "undefined" && logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.NavBar.Avatar.width,
            height: ImageSizes.Profile.NavBar.Avatar.height,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.NavBar.BlurredAvatar.width,
            height: ImageSizes.Profile.NavBar.BlurredAvatar.height,
          },
          blur: BlurFactor,
        });
      }
    }
    return {
      ...entity,
      logo,
      blurredLogo,
    };
  });

  let preferredExploreOrganizationsView: "map" | "list" = "list";

  const cookieHeader = request.headers.get("Cookie");
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookie = (await viewCookie.parse(cookieHeader)) as null | any;
  if (cookie !== null) {
    try {
      preferredExploreOrganizationsView = viewCookieSchema.parse(cookie);
    } catch {
      // ignore invalid cookie
    }
  }

  // Make prefetching work with a short lived cache header only on requests that have a prefetch purpose
  // see https://sergiodxa.com/tutorials/fix-double-data-request-when-prefetching-in-remix
  const combinedHeaders = combineHeaders(
    headers,
    alertHeaders,
    toastHeaders,
    languageCookieHeaders
  );
  const isGet = request.method.toLowerCase() === "get";
  const purpose =
    request.headers.get("Purpose") ||
    request.headers.get("X-Purpose") ||
    request.headers.get("Sec-Purpose") ||
    request.headers.get("Sec-Fetch-Purpose") ||
    request.headers.get("Moz-Purpose");
  const isPrefetch = purpose === "prefetch";

  // If it's a GET request and it's a prefetch request and it doesn't have a Cache-Control header
  if (isGet && isPrefetch && !combinedHeaders.has("Cache-Control")) {
    // we will cache for 10 seconds only on the browser
    combinedHeaders.set("Cache-Control", "private, max-age=10");
  }

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
      entities: enhancedEntities,
      preferredExploreOrganizationsView,
    },
    {
      headers: combinedHeaders,
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
    "flex min-h-dvh break-words antialiased overflow-x-hidden",
    mainMenuIsOpen !== null &&
      mainMenuIsOpen !== "false" &&
      "overflow-y-hidden xl:overflow-y-visible"
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
          preferredExploreOrganizationsView={
            hasRootLoaderData
              ? rootLoaderData.preferredExploreOrganizationsView
              : "map"
          }
        />
        <div
          className={`flex flex-col w-full @container relative ${
            mainMenuIsOpen === null || mainMenuIsOpen === "false"
              ? ""
              : "hidden xl:block"
          }`}
        >
          <NavBar
            sessionUserInfo={
              hasRootLoaderData ? rootLoaderData.sessionUserInfo : undefined
            }
            openMainMenuKey={openMainMenuKey}
            locales={hasRootLoaderData ? rootLoaderData.locales : undefined}
          />
          <main className="w-full h-full @md:bg-neutral-50">
            {/* Content */}
            <section className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl my-8 md:mt-10 lg:mt-20 text-center">
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
              <section className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl my-8 md:mt-10 lg:mt-20 text-center">
                <p>Error Text:</p>
                {errorText}
              </section>
            ) : null}
            {errorData !== undefined ? (
              <section className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl my-8 md:mt-10 lg:mt-20 text-center">
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
    preferredExploreOrganizationsView,
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
    "flex min-h-dvh break-words antialiased overflow-x-hidden",
    modal && "overflow-y-hidden",
    overlayMenu && "overflow-y-hidden container-lg:overflow-y-visible",
    showFilters !== null &&
      showFilters === "on" &&
      "overflow-y-hidden container-lg:overflow-y-visible",
    mainMenuIsOpen !== null &&
      mainMenuIsOpen !== "false" &&
      "overflow-y-hidden xl:overflow-y-visible"
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
              className={mainMenuIsOpen ? "w-full xl:w-fit" : "hidden xl:block"}
            >
              <MainMenu
                mode={mode}
                openMainMenuKey={openMainMenuKey}
                username={sessionUserInfo?.username}
                currentLanguage={currentLanguage}
                locales={locales}
                preferredExploreOrganizationsView={
                  preferredExploreOrganizationsView
                }
              />
            </div>
            <div
              inert={modal ? true : undefined}
              className={`flex flex-col w-full @container relative ${
                mainMenuIsOpen === null || mainMenuIsOpen === "false"
                  ? ""
                  : "hidden xl:block"
              }`}
            >
              <div
                className={`${showFilters ? "hidden @lg:block " : ""}${
                  isProjectSettings || isOrganizationSettings
                    ? "hidden @md:block "
                    : ""
                }sticky top-0 z-30`}
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
                      ? "hidden @md:block "
                      : ""
                  }${showFilters ? "hidden @lg:block" : ""}`}
                >
                  <LoginOrRegisterCTA
                    isAnon={mode === "anon"}
                    locales={locales}
                  />
                </div>
              )}
              <div className="flex flex-nowrap w-full">
                <main className="w-full @md:bg-neutral-50">
                  <Outlet />
                </main>
                <div
                  className={`${isSettings ? "hidden @md:block " : ""}${
                    showFilters === "true" && isMapOnExplore === false
                      ? "hidden @lg:block "
                      : ""
                  }${isMapOnExplore ? "hidden " : ""}w-0`}
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
