import type {
  AppLoadContext,
  EntryContext,
  HandleErrorFunction,
} from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import * as isbotModule from "isbot";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { getEnv, init as initEnv } from "./env.server";
import * as Sentry from "@sentry/node";

// Reject/cancel all pending promises after 5 seconds
export const streamTimeout = 5000;

initEnv();
global.ENV = getEnv();

export const handleError: HandleErrorFunction = (error, { request }) => {
  // React Router may abort some interrupted requests, don't log those
  if (!request.signal.aborted) {
    console.log("Server error - tracking with server sentry");
    console.error(error);
    Sentry.captureException(error);
  }
};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  loadContext?: AppLoadContext
) {
  // Appending global security response headers
  console.log("Entry server - handleRequest");
  const nonce = crypto.randomUUID();
  responseHeaders.append(
    "Content-Security-Policy",
    `default-src 'self' 'nonce-${nonce}'; frame-ancestors 'none'; upgrade-insecure-requests; report-to csp-endpoint`
  );
  responseHeaders.append(
    "Reporting-Endpoints",
    `csp-endpoint='${process.env.COMMUNITY_BASE_URL}/csp-reports'`
  );
  const enhancedAppLoadContext = {
    ...loadContext,
    nonce,
  };

  // Appending profiling policy header to the response when sentry is enabled
  if (
    process.env.NODE_ENV === "production" &&
    typeof process.env.SENTRY_DSN !== "undefined"
  ) {
    responseHeaders.append("Document-Policy", "js-profiling");
  }

  const prohibitOutOfOrderStreaming =
    isBotRequest(request.headers.get("user-agent")) ||
    reactRouterContext.isSpaMode;

  return prohibitOutOfOrderStreaming
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        reactRouterContext,
        enhancedAppLoadContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        reactRouterContext,
        enhancedAppLoadContext
      );
}

function isBotRequest(userAgent: string | null) {
  if (!userAgent) {
    return false;
  }
  if ("isbot" in isbotModule && typeof isbotModule.isbot === "function") {
    return isbotModule.isbot(userAgent);
  }
  return false;
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  loadContext?: AppLoadContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={loadContext?.nonce}
      />,
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
            Sentry.captureException(error);
          }
        },
      }
    );

    setTimeout(abort, streamTimeout + 1000);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  loadContext?: AppLoadContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={loadContext?.nonce}
      />,
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
            Sentry.captureException(error);
          }
        },
      }
    );

    setTimeout(abort, streamTimeout + 1000);
  });
}
