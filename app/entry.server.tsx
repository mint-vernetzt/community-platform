import { PassThrough } from "stream";
import type { EntryContext } from "@remix-run/node";
import { Response } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import isbot from "isbot";
import { renderToPipeableStream } from "react-dom/server";

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

const ABORT_DELAY = 5000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        [callbackName]: () => {
          const body = new PassThrough();

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(body, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError: (err: unknown) => {
          reject(err);
        },
        onError: (error: unknown) => {
          didError = true;

          console.error(error);
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
