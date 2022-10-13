import * as React from "react";
import type { MetaFunction } from "remix";
import {
  Form,
  json,
  Link,
  Links,
  LinksFunction,
  LiveReload,
  LoaderFunction,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "remix";
import { forbidden } from "remix-utils";
import { authenticator, getUserByRequest, sessionStorage } from "./auth.server";
import Footer from "./components/Footer/Footer";
import { getImageURL } from "./images.server";
import { getInitials } from "./lib/profile/getInitials";
import { getProfileByUserId } from "./profile.server";
import { getPublicURL } from "./storage.server";
import styles from "./styles/styles.css";
import { supabaseClient } from "./supabase";
import { createCSRFToken } from "./utils.server";

export const meta: MetaFunction = () => {
  return { title: "MINTvernetzt Community Plattform (Preview)" };
};

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export type RootRouteData = {
  matomoUrl: string | undefined;
  matomoSiteId: string | undefined;
  csrf: string | undefined;
  currentUserInfo?: CurrentUserInfo;
};

type LoaderData = RootRouteData;

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  let csrf;
  if (session !== null) {
    csrf = createCSRFToken();
    session.set("csrf", csrf);
  }

  const sessionValue = session.get(authenticator.sessionKey);
  const hasSession = sessionValue !== undefined;

  if (hasSession) {
    const accessToken = sessionValue.access_token;

    if (!accessToken) {
      throw forbidden({ message: "not allowed" }); // TODO: maybe other message
    }

    supabaseClient.auth.setAuth(accessToken);
  }

  const currentUser = await getUserByRequest(request);

  let currentUserInfo;

  if (currentUser !== null) {
    const profile = await getProfileByUserId(currentUser.id, [
      "username",
      "firstName",
      "lastName",
      "avatar",
    ]);

    let avatar: string | undefined;

    if (profile && profile.avatar) {
      const publicURL = getPublicURL(profile.avatar);
      if (publicURL) {
        avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
        });
      }
    }
    currentUserInfo = {
      username: profile.username,
      initials: getInitials(profile),
      avatar,
    };
  }

  return json<LoaderData>(
    {
      csrf,
      matomoUrl: process.env.MATOMO_URL,
      matomoSiteId: process.env.MATOMO_SITE_ID,
      currentUserInfo,
    },
    { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } }
  );
};

function HeaderLogo() {
  return (
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="56"
        height="56"
        viewBox="0 0 56 56"
        aria-describedby="mint-title-header"
        role="img"
        className="w-10 h-10 md:w-auto md:h-auto"
      >
        <title id="mint-title-header">Logo: mint vernetzt</title>
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
    </div>
  );
}

type NavBarProps = {
  currentUserInfo?: CurrentUserInfo;
};

type CurrentUserInfo = {
  username: string;
  initials: string;
  avatar?: string;
};

function NavBar(props: NavBarProps) {
  return (
    <header className="shadow-md mb-8">
      <div className="container relative z-10">
        <div className="py-3 flex flex-row items-center">
          <div>
            <Link to="/explore">
              <HeaderLogo />
            </Link>
          </div>
          {/* TODO: link to login on anon*/}
          {props.currentUserInfo !== undefined ? (
            <div className="ml-auto">
              <div className="dropdown dropdown-end">
                {props.currentUserInfo.avatar === undefined ? (
                  <label
                    tabIndex={0}
                    className="text-sm w-10 h-10 font-semibold bg-primary text-white flex items-center justify-center rounded-md overflow-hidden"
                  >
                    {props.currentUserInfo.initials}
                  </label>
                ) : (
                  <label tabIndex={0} className="w-10 h-10 rounded-md">
                    <img
                      src={props.currentUserInfo.avatar}
                      alt={props.currentUserInfo.initials}
                      className="w-10 h-10 rounded-full"
                    />
                  </label>
                )}
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li>
                    <Link to={`/profile/${props.currentUserInfo.username}`}>
                      Profil anzeigen
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/profile/${props.currentUserInfo.username}/settings`}
                    >
                      Profil bearbeiten
                    </Link>
                  </li>
                  <li>
                    <Form action="/logout?index" method="post">
                      <button type="submit" className="w-full text-left">
                        Logout
                      </button>
                    </Form>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="ml-auto">
              <Link
                to="/login"
                className="text-primary font-bold hover:underline"
              >
                Anmelden
              </Link>{" "}
              /{" "}
              <Link
                to="/register"
                className="text-primary font-bold hover:underline"
              >
                Registrieren
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
  const { matomoUrl, matomoSiteId, currentUserInfo } =
    useLoaderData<LoaderData>();

  React.useEffect(() => {
    if (matomoSiteId !== undefined && window._paq !== undefined) {
      window._paq.push(["setCustomUrl", location.pathname]);
      window._paq.push(["trackPageView"]);
    }
  }, [location, matomoSiteId]);

  const nonAppBaseRoutes = ["/login", "/register", "/reset"];
  const isNonAppBaseRoute = nonAppBaseRoutes.some((baseRoute) =>
    location.pathname.startsWith(baseRoute)
  );

  const differentFooterRoutes = "/settings/general";
  const isDifferentFooterRoute = location.pathname.includes(
    differentFooterRoutes
  );

  return (
    <html lang="en" data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        {matomoSiteId !== undefined && (
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
        )}
      </head>

      <body>
        <div className="flex flex-col min-h-screen">
          {isNonAppBaseRoute ? null : (
            <NavBar currentUserInfo={currentUserInfo} />
          )}

          <main className="flex-auto">
            <Outlet />
          </main>

          <Footer isDifferentFooterRoute={isDifferentFooterRoute} />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
