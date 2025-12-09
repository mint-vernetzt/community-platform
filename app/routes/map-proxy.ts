import { type LoaderFunctionArgs } from "react-router";
import { MAX_QUEUE_LENGTH, processQueue, queue } from "./map-proxy.server";

export const loader = async (args: LoaderFunctionArgs) => {
  if (queue.length >= MAX_QUEUE_LENGTH) {
    throw new Response("Too many requests", { status: 429 });
  }
  let response;
  try {
    response = await new Promise<Response>((resolve, reject) => {
      queue.push(async () => {
        const url = new URL(args.request.url);
        const path = url.searchParams.get("path");
        if (path === null) {
          reject(new Response("Missing path parameter", { status: 400 }));
        }

        // TODO: remove console log
        console.log(
          `Queue length: ${queue.length} | Fetch: `,
          new Date().toISOString(),
          path
        );

        const response = await fetch(`https://tiles.versatiles.org${path}`);
        if (response.status !== 200) {
          reject(new Response("Upstream error", { status: 502 }));
        }
        const headers = new Headers();
        const contentType = response.headers.get("content-type");
        if (contentType) {
          headers.set("content-type", contentType);
        }
        const cacheControl = response.headers.get("cache-control");
        if (cacheControl) {
          headers.set("cache-control", cacheControl);
        }
        resolve(new Response(response.body, { headers }));
      });
      processQueue();
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return new Response("Internal Server Error", { status: 500 });
  }
  return response;
};
