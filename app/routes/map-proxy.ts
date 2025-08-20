import { type LoaderFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";

export const loader = async (args: LoaderFunctionArgs) => {
  const url = new URL(args.request.url);
  const path = url.searchParams.get("path");
  invariantResponse(path !== null, "Missing path parameter", { status: 400 });

  const response = await fetch(`https://tiles.openfreemap.org${path}`);
  invariantResponse(response.status === 200, "Failed to fetch resource", {
    status: 404,
  });
  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  const cacheControl = response.headers.get("cache-control");
  if (cacheControl) {
    headers.set("cache-control", cacheControl);
  }

  return new Response(response.body, {
    headers,
  });
};
