import { createReadableStreamFromReadable } from "@react-router/node";
import * as isbotModule from "isbot";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import type { EntryContext, HandleErrorFunction } from "react-router";
import { ServerRouter } from "react-router";
import { getEnv, init as initEnv } from "./env.server";
import { NonceProvider } from "./nonce-provider";
import { captureException } from "@sentry/node";
import { createCSPHeaderOptions } from "./utils.server";

// Reject/cancel all pending promises after 5 seconds
export const streamTimeout = 5000;

initEnv();
global.ENV = getEnv();

export const handleError: HandleErrorFunction = (error, { request }) => {
  // React Router may abort some interrupted requests, don't log those
  if (!request.signal.aborted) {
    console.error(error);
    captureException(error);
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

  const url = new URL(request.url);
  const isMap = url.pathname === "/map";

  const connectSrc = ["'self'"];
  if (process.env.NODE_ENV === "production") {
    connectSrc.push(process.env.MATOMO_URL);
    if (typeof process.env.SENTRY_DSN !== "undefined") {
      connectSrc.push(
        process.env.SENTRY_DSN.replace(/https?:\/\//, "")
          .replace(/sentry\.io.*/, "sentry.io")
          .replace(/^.*@/, "")
      );
    }
  }
  if (isMap) {
    connectSrc.push("https://tiles.openfreemap.org");
  }

  const cspHeaderOptions = createCSPHeaderOptions({
    "default-src": "'none'",
    "style-src": "'self'",
    "style-src-attr": "'self'",
    "style-src-elem": "'self'",
    "font-src": "'self'",
    "form-action": "'self'",
    "script-src": `'self' ${process.env.MATOMO_URL} 'nonce-${nonce}'`,
    "img-src": `'self' ${
      process.env.MATOMO_URL
    } data: ${process.env.IMGPROXY_URL.replace(/https?:\/\//, "")}`,
    "worker-src": "blob:",
    "frame-src": `'self' www.youtube.com www.youtube-nocookie.com 'nonce-${nonce}'`,
    "base-uri": "'self'",
    "frame-ancestors": isMap ? false : "'none'",
    "report-uri": `${process.env.COMMUNITY_BASE_URL}/csp-reports`,
    "report-to": "csp-endpoint",
    "upgrade-insecure-requests": process.env.NODE_ENV === "production",
    "connect-src": connectSrc.join(" "),
  });

  responseHeaders.set("Content-Security-Policy", cspHeaderOptions);
  if (isMap === false) {
    responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
  }
  responseHeaders.set("Referrer-Policy", "same-origin");

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
            captureException(error);
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
            captureException(error);
          }
        },
        nonce: nonce,
      }
    );

    setTimeout(abort, streamTimeout + 1000);
  });
}
