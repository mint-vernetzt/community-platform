import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { StrictMode, startTransition, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";

if (ENV.MODE === "production" && ENV.SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: ENV.SENTRY_DSN,
      tracesSampleRate: 1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1,
      environment: ENV.COMMUNITY_BASE_URL.replace(/https?:\/\//, ""),
      integrations: [
        Sentry.browserTracingIntegration({
          useEffect,
          useLocation,
          useMatches,
        }),
        Sentry.replayIntegration(),
      ],
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
        <RemixBrowser />
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
