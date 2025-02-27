import { HydratedRouter } from "react-router/dom";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router";
import {
  init as initSentry,
  replayIntegration,
  browserProfilingIntegration,
  reactRouterV7BrowserTracingIntegration,
} from "@sentry/react";
import { StrictMode, startTransition, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";

if (ENV.MODE === "production" && typeof ENV.SENTRY_DSN !== "undefined") {
  try {
    initSentry({
      dsn: ENV.SENTRY_DSN,
      environment: ENV.COMMUNITY_BASE_URL.replace(/https?:\/\//, ""),
      beforeSend(event) {
        if (event.request?.url) {
          const url = new URL(event.request.url);
          if (
            url.protocol === "chrome-extension:" ||
            url.protocol === "moz-extension:"
          ) {
            // This error is from a browser extension, ignore it
            return null;
          }
        }
        return event;
      },
      integrations: [
        replayIntegration(),
        browserProfilingIntegration(),
        reactRouterV7BrowserTracingIntegration({
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
      ],

      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,

      // Capture Replay for 10% of all sessions,
      // plus for 100% of sessions with an error
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  } catch (error) {
    console.warn("Sentry initialization failed");
    const stringifiedError = JSON.stringify(
      error,
      Object.getOwnPropertyNames(error)
    );
    fetch(`/error?error=${encodeURIComponent(stringifiedError)}`, {
      method: "GET",
    });
  }
}

async function hydrate() {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1);
}
