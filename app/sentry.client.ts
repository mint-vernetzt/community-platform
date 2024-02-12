import { useLocation, useMatches } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { useEffect } from "react";

let sentryInitialized = false;

export function initializeSentry(options: { baseUrl: string; dsn: string }) {
  if (sentryInitialized) {
    return;
  }

  Sentry.init({
    dsn: options.dsn,
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    environment: new URL(options.baseUrl).host,

    integrations: [
      Sentry.browserTracingIntegration({
        useEffect,
        useLocation,
        useMatches,
      }),
      Sentry.replayIntegration(),
    ],
  });

  sentryInitialized = true;
}
