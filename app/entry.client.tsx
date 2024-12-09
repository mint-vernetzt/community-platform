import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import i18next from "i18next";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import Fetch from "i18next-fetch-backend";
import { StrictMode, startTransition, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { defaultNS, fallbackLng, resources, supportedLngs } from "~/i18n";

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
  const languages = resources!;
  const namespaces = [];
  for (const lng in languages) {
    const typedKey = lng as keyof typeof languages;
    const keys = Object.keys(languages[typedKey]);
    for (const key of keys) {
      namespaces.push(key);
    }
  }

  await i18next
    .use(initReactI18next) // Tell i18next to use the react-i18next plugin
    .use(Fetch) // Tell i18next to use the Fetch backend
    .use(I18nextBrowserLanguageDetector) // Setup a client-side language detector
    .init({
      defaultNS,
      fallbackLng,
      supportedLngs,
      ns: namespaces,
      detection: {
        // Here only enable htmlTag detection, we'll detect the language only
        // server-side with remix-i18next, by using the `<html lang>` attribute
        // we can communicate to the client the language detected server-side
        order: ["htmlTag"],
        // Because we only use htmlTag, there's no reason to cache the language
        // on the browser, so we disable it
        caches: [],
      },
      backend: {
        // We will configure the backend to fetch the translations from the
        // resource route /i18n/locales and pass the lng and ns as search params
        loadPath: "/i18n/locales?lng={{lng}}&ns={{ns}}",
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
