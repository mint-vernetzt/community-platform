import { renderToPipeableStream } from "react-dom/server";
import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { PassThrough } from "stream";
import i18n from "~/i18n";
import Backend from "i18next-fs-backend";
import i18next from "~/i18next.server";
import { createInstance } from "i18next";
import isbot from "isbot";
import { resolve } from "node:path";

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

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  let callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  const instance = createInstance();
  const lng = await i18next.getLocale(request);
  const ns = i18next.getRouteNamespaces(remixContext);

  await instance
    .use(initReactI18next)
    .use(Backend)
    .init({
      ...i18n,
      // initImmediate: false,
      lng,
      ns,
      backend: {
        loadPath: function (lng: string, ns: string) {
          console.log("SERVER: " + lng);
          return resolve(`./public/locales/${lng}/${ns}.json`);
        },
      },
    });

  return new Promise((resolve, reject) => {
    let didError = false;

    let { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={instance}>
        <RemixServer context={remixContext} url={request.url} />
      </I18nextProvider>,
      {
        [callbackName]: () => {
          const body = new PassThrough();

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            // @ts-ignore
            new Response(body, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          didError = true;
          console.error(error);
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
