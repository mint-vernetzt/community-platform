import type {
  ActionFunctionArgs,
  AppLoadContext,
  EntryContext,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import * as isbotModule from "isbot";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { getEnv, init } from "./env.server";

// Reject/cancel all pending promises after 5 seconds
export const streamTimeout = 5000;

init();
global.ENV = getEnv();

if (
  process.env.NODE_ENV === "production" &&
  typeof process.env.SENTRY_DSN !== "undefined"
) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1,
    environment: process.env.COMMUNITY_BASE_URL.replace(/https?:\/\//, ""),
  });
}

export function handleError(
  error: unknown,
  { request, params, context }: LoaderFunctionArgs | ActionFunctionArgs
) {
  if (!request.signal.aborted) {
    console.error({ error });
    void Sentry.captureRemixServerException(error, "remix.server", request);
  }
}

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
  let prohibitOutOfOrderStreaming =
    isBotRequest(request.headers.get("user-agent")) || remixContext.isSpaMode;

  return prohibitOutOfOrderStreaming
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
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
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
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
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
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
