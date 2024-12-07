import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import backend from "i18next-fs-backend/cjs";
import { StrictMode, startTransition, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { getInitialNamespaces } from "remix-i18next/client";
import i18n from "./i18n";
import { localesUrl, requestOptions } from "./lib/no-cache";

if (ENV.MODE === "production" && ENV.SENTRY_DSN) {
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
}

async function hydrate() {
  await i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(backend)
    .init({
      ...i18n,
      ns:
        typeof window !== "undefined" &&
        typeof window.__reactRouterRouteModules !== "undefined"
          ? getInitialNamespaces()
          : [],
      backend: {
        loadPath: localesUrl,
        requestOptions: requestOptions(),
      },
      detection: {
        order: ["cookie", "htmlTag"],
        caches: ["cookie"],
        excludeCacheFor: ["cimode"],
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <I18nextProvider i18n={i18next}>
          <RemixBrowser />
        </I18nextProvider>
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
