import type {
  ActionFunctionArgs,
  AppLoadContext,
  EntryContext,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { createInstance, type i18n } from "i18next";
import Backend from "i18next-fs-backend";
import { isbot } from "isbot";
import { resolve } from "node:path";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18nConfig from "~/i18n";
import i18next from "~/i18next.server";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_ANON_KEY: string;
      SESSION_SECRET: string;
      SUPABASE_URL: string;
      HASH_SECRET: string;
      IMGPROXY_URL: string;
      IMGPROXY_KEY: string;
      IMGPROXY_SALT: string;
      COMMUNITY_BASE_URL: string;
      DATABASE_URL: string;
      SERVICE_ROLE_KEY: string;
      MATOMO_URL: string;
      MATOMO_SITE_ID: string;
      API_KEY: string;
      MAILER_HOST: string;
      MAILER_PORT: string;
      MAILER_USER: string;
      MAILER_PASS: string;
      SUBMISSION_SENDER: string;
      NEWSSUBMISSION_RECIPIENT: string;
      NEWSSUBMISSION_SUBJECT: string;
      EVENTSUBMISSION_RECIPIENT: string;
      EVENTSUBMISSION_SUBJECT: string;
      PAKTSUBMISSION_RECIPIENT: string;
      PAKTSUBMISSION_SUBJECT: string;
      FEATURE_FLAGS: string;
      SENTRY_DSN: string;
    }
  }
}
if (process.env.SESSION_SECRET === undefined) {
  throw new Error("'SESSION_SECRET' must be set.");
}

if (process.env.SUPABASE_URL === undefined) {
  throw new Error("'SUPABASE_URL' is required");
}

if (process.env.SUPABASE_ANON_KEY === undefined) {
  throw new Error("'SUPABASE_ANON_KEY' is required");
}

if (process.env.HASH_SECRET === undefined) {
  throw new Error("'HASH_SECRET' is required");
}

if (process.env.IMGPROXY_URL === undefined) {
  throw new Error("'IMGPROXY_URL' is required");
}

if (process.env.IMGPROXY_KEY === undefined) {
  throw new Error("'IMGPROXY_KEY' is required");
}

if (process.env.IMGPROXY_SALT === undefined) {
  throw new Error("'IMGPROXY_SALT' is required");
}

if (process.env.COMMUNITY_BASE_URL === undefined) {
  throw new Error("'COMMUNITY_BASE_URL' is required");
}

if (process.env.DATABASE_URL === undefined) {
  throw new Error("'DATABASE_URL' is required");
}

if (process.env.SERVICE_ROLE_KEY === undefined) {
  throw new Error("'SERVICE_ROLE_KEY' is required");
}

if (process.env.MATOMO_URL === undefined) {
  throw new Error("'MATOMO_URL' is required");
}

if (process.env.MATOMO_SITE_ID === undefined) {
  throw new Error("'MATOMO_SITE_ID' is required");
}

if (process.env.API_KEY === undefined) {
  throw new Error("'API_KEY' is required");
}

if (process.env.MAILER_HOST === undefined) {
  throw new Error("'MAILER_HOST' is required");
}

if (process.env.MAILER_PORT === undefined) {
  throw new Error("'MAILER_PORT' is required");
}

if (process.env.MAILER_USER === undefined) {
  throw new Error("'MAILER_USER' is required");
}

if (process.env.MAILER_PASS === undefined) {
  throw new Error("'MAILER_PASS' is required");
}

if (process.env.SUBMISSION_SENDER === undefined) {
  throw new Error("'SUBMISSION_SENDER' is required");
}

if (process.env.NEWSSUBMISSION_RECIPIENT === undefined) {
  throw new Error("'NEWSSUBMISSION_RECIPIENT' is required");
}

if (process.env.NEWSSUBMISSION_SUBJECT === undefined) {
  throw new Error("'NEWSSUBMISSION_SUBJECT' is required");
}

if (process.env.EVENTSUBMISSION_RECIPIENT === undefined) {
  throw new Error("'EVENTSUBMISSION_RECIPIENT' is required");
}

if (process.env.EVENTSUBMISSION_SUBJECT === undefined) {
  throw new Error("'EVENTSUBMISSION_SUBJECT' is required");
}

if (process.env.PAKTSUBMISSION_RECIPIENT === undefined) {
  throw new Error("'PAKTSUBMISSION_RECIPIENT' is required");
}

if (process.env.PAKTSUBMISSION_SUBJECT === undefined) {
  throw new Error("'PAKTSUBMISSION_SUBJECT' is required");
}

if (process.env.FEATURE_FLAGS === undefined) {
  throw new Error("'FEATURE_FLAGS' is required");
}

if (process.env.SENTRY_DSN === undefined) {
  throw new Error("'SENTRY_DSN' is required");
}

export function handleError(
  error: unknown,
  { request }: LoaderFunctionArgs | ActionFunctionArgs
) {
  Sentry.captureRemixServerException(error, "remix.server", request);
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1,
  environment: new URL(process.env.COMMUNITY_BASE_URL).host,
});

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext
) {
  const i18nInstance = createInstance();
  const lng = await i18next.getLocale(request);
  const ns = i18next.getRouteNamespaces(remixContext);

  await i18nInstance
    .use(initReactI18next)
    .use(Backend)
    .init({
      ...i18nConfig,
      lng,
      ns,
      backend: {
        loadPath: function (lng: string, ns: string) {
          return resolve(`./public/locales/${lng}/${ns}.json`);
        },
      },
      detection: {
        order: ["cookie", "htmlTag"],
        caches: ["cookie"],
        excludeCacheFor: ["cimode"],
      },
    });

  return isbot(request.headers.get("user-agent"))
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext,
        i18nInstance as i18n
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext,
        i18nInstance as i18n
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  i18nInstance: i18n
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18nInstance}>
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />
      </I18nextProvider>,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  i18nInstance: i18n
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18nInstance}>
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />
      </I18nextProvider>,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
