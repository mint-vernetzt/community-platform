import { createReadableStreamFromReadable } from "@react-router/node";
import * as Sentry from "@sentry/node";
import * as isbotModule from "isbot";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import type { EntryContext, HandleErrorFunction } from "react-router";
import { ServerRouter } from "react-router";
import { getEnv, init as initEnv } from "./env.server";
import { NonceProvider } from "./nonce-provider";

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
  reactRouterContext: EntryContext
) {
  // Setting global security response headers
  const nonce = crypto.randomUUID();
  responseHeaders.set(
    "Reporting-Endpoints",
    `csp-endpoint='${process.env.COMMUNITY_BASE_URL}/csp-reports'`
  );
  responseHeaders.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' ; img-src 'self' ${process.env.IMGPROXY_URL.replace(
      /https?:\/\//,
      ""
    )}; frame-src 'self' www.youtube.com www.youtube-nocookie.com 'nonce-${nonce}'; frame-ancestors 'none'; report-uri ${
      process.env.COMMUNITY_BASE_URL
    }/csp-reports; report-to csp-endpoint;${
      process.env.NODE_ENV === "production" ? " upgrade-insecure-requests;" : ""
    }${
      process.env.NODE_ENV === "production" &&
      typeof process.env.SENTRY_DSN !== "undefined"
        ? ` connect-src 'self' ${process.env.SENTRY_DSN.replace(
            /https?:\/\//,
            ""
          )};`
        : ""
    }`
  );

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
        nonce
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        reactRouterContext,
        nonce
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
  nonce: `${string}-${string}-${string}-${string}-${string}`
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <ServerRouter
          context={reactRouterContext}
          url={request.url}
          nonce={nonce}
        />
      </NonceProvider>,
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
        nonce: nonce,
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
  nonce: `${string}-${string}-${string}-${string}-${string}`
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <ServerRouter
          context={reactRouterContext}
          url={request.url}
          nonce={nonce}
        />
      </NonceProvider>,
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
        nonce: nonce,
      }
    );

    setTimeout(abort, streamTimeout + 1000);
  });
}
