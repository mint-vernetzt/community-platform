import { Alert } from "@mint-vernetzt/components/src/molecules/Alert";
import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";
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
import { useHydrated } from "remix-utils/use-hydrated";
import { Footer } from "~/components-next/Footer";
import { NavBar } from "~/components-next/NavBar";
import { getAlert } from "./alert.server";
import { createAuthClient, getSessionUser } from "./auth.server";
import { LoginOrRegisterCTA } from "./components-next/LoginOrRegisterCTA";
import { MainMenu } from "./components-next/MainMenu";
import { ModalRoot } from "./components-next/ModalRoot";
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
import { getProfileByUserId } from "./root.server";
import { getFeatureAbilities } from "./routes/feature-access.server";
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
  const navBarMenuIsOpen = searchParams.get(openMainMenuKey);

  const bodyClasses = classNames(
    "mv-min-h-screen mv-break-words",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "mv-overflow-hidden xl:mv-overflow-auto"
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

      <body className={bodyClasses}>
        <div id="top" className="mv-flex mv-flex-col mv-min-h-screen">
          <NavBar
            sessionUserInfo={
              hasRootLoaderData ? rootLoaderData.sessionUserInfo : undefined
            }
            openMainMenuKey={openMainMenuKey}
            locales={hasRootLoaderData ? rootLoaderData.locales : undefined}
          />
          <div className="mv-flex mv-h-full mv-min-h-screen">
            <MainMenu
              mode={hasRootLoaderData ? rootLoaderData.mode : "anon"}
              openMainMenuKey={openMainMenuKey}
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
                  : DEFAULT_LANGUAGE
              }
              locales={hasRootLoaderData ? rootLoaderData.locales : undefined}
            />
            <div className="mv-flex-grow mv-@container mv-min-h-screen">
              <div className="mv-min-h-screen">
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
              </div>
              <Footer
                locales={hasRootLoaderData ? rootLoaderData.locales : undefined}
              />
            </div>
          </div>
        </div>
        <ScrollRestoration nonce={nonce} />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
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
    abilities,
  } = useLoaderData<typeof loader>();
  const location = useLocation();
  const nonce = useNonce();
  const isHydrated = useHydrated();

  useEffect(() => {
    if (matomoSiteId !== undefined && window._paq !== undefined) {
      try {
        window._paq.push(["setCustomUrl", window.location.href]);
        window._paq.push(["trackPageView"]);
      } catch (error) {
        console.warn(
          `Failed to push "setCustomUrl" and "trackPageView" on window._paq for matomo initialization. Error: ${error}`
        );
      }
    }
  }, [location, matomoSiteId]);

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
  const openMainMenuKey = "mainMenu";
  const navBarMenuIsOpen = searchParams.get(openMainMenuKey);

  const bodyClasses = classNames(
    "mv-min-h-screen mv-break-words mv-antialiased",
    modal && "mv-overflow-hidden",
    showFilters !== null &&
      showFilters === "on" &&
      "mv-overflow-hidden container-lg:mv-overflow-visible",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "mv-overflow-hidden xl:mv-overflow-visible"
  );

  const main = (
    <main className="mv-flex-auto mv-relative mv-w-full mv-bg-white container-md:mv-bg-neutral-50">
      {alert !== null ? (
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
          <CircleButton
            as="a"
            href={`${location.pathname}${location.search}#top`}
            size="large"
            floating
          >
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
        {typeof matomoSiteId !== "undefined" &&
        matomoSiteId !== "" &&
        isHydrated === true ? (
          <script
            async
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                var _paq = window._paq = window._paq || [];
                _paq.push(['enableLinkTracking']);
                (function() {
                  var u="${matomoUrl}";
                  _paq.push(['setTrackerUrl', u+'matomo.php']);
                  _paq.push(['setSiteId', '${matomoSiteId}']);
                  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                  g.async=true; g.nonce="${nonce}"; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
                })();
              `,
            }}
          />
        ) : null}
      </head>

      <body className={bodyClasses}>
        <div id="top" className={bodyClasses}>
          <div className="mv-flex mv-flex-col mv-min-h-screen">
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
                openMainMenuKey={openMainMenuKey}
                locales={locales}
              />
            </div>

            <div className="mv-flex mv-h-full mv-min-h-screen">
              <MainMenu
                mode={mode}
                openMainMenuKey={openMainMenuKey}
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
        <ScrollRestoration nonce={nonce} />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}
