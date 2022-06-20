import { renderToString } from "react-dom/server";
import { RemixServer } from "remix";
import type { EntryContext } from "remix";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_ANON_KEY: string;
      SESSION_SECRET: string;
      SUPABASE_URL: string;
      HASH_SECRET: string;
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

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
