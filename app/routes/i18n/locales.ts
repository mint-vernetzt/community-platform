import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { cacheHeader } from "pretty-cache-header";
import { z } from "zod";
import { resources } from "~/i18next.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const languages = resources;

  const lng = z
    .string()
    .refine((lng): lng is keyof typeof languages =>
      Object.keys(languages).includes(lng)
    )
    .parse(url.searchParams.get("lng"));

  const namespaces = languages[lng];

  const ns = z
    .string()
    .refine((ns): ns is keyof typeof namespaces => {
      return Object.keys(languages[lng]).includes(ns);
    })
    .parse(url.searchParams.get("ns"));

  const headers = new Headers();

  // TODO: Persistent and more controlled caching via clientLoader and localForage -> see: https://www.youtube.com/watch?v=fuwm0BBNkRY
  // On production, we want to add cache headers to the response
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Cache-Control",
      cacheHeader({
        maxAge: "5m", // Cache in the browser for 5 minutes
        sMaxage: "1d", // Cache in the CDN for 1 day
        // Serve stale content while revalidating for 7 days
        staleWhileRevalidate: "7d",
        // Serve stale content if there's an error for 7 days
        staleIfError: "7d",
      })
    );
  }

  return json(namespaces[ns], { headers });
}
