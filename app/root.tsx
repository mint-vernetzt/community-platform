import * as React from "react";
import {
  json,
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
import type { MetaFunction } from "remix";
import styles from "./styles/styles.css";
import { createCSRFToken } from "./utils.server";
import { authenticator, sessionStorage } from "./auth.server";
import { forbidden } from "remix-utils";
import { supabaseClient } from "./supabase";

export const meta: MetaFunction = () => {
  return { title: "MINTvernetzt Community Plattform (Preview)" };
};

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export type RootRouteData = {
  matomoUrl: string | undefined;
  matomoSiteId: string | undefined;
  csrf: string | undefined;
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

  return json<LoaderData>(
    {
      csrf,
      matomoUrl: process.env.MATOMO_URL,
      matomoSiteId: process.env.MATOMO_SITE_ID,
    },
    { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } }
  );
};

export default function App() {
  const location = useLocation();
  const { matomoUrl, matomoSiteId } = useLoaderData<LoaderData>();

  React.useEffect(() => {
    if (matomoSiteId !== undefined && window._paq !== undefined) {
      window._paq.push(["setCustomUrl", location.pathname]);
      window._paq.push(["trackPageView"]);
    }
  }, [location, matomoSiteId]);

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
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
