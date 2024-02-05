import { useEffect } from "react";
import * as Sentry from "@sentry/remix";
import { hydrateRoot } from "react-dom/client";
import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,

  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.remixRouterInstrumentation(
        useEffect,
        useLocation,
        useMatches
      ),
    }),
    Sentry.replayIntegration(),
  ],
});

hydrateRoot(document, <RemixBrowser />);
