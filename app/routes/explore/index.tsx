import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";

// handle "/profiles" as default route
export const loader: LoaderFunction = async ({ request }) => {
  const response = new Response();
  createAuthClient(request, response);
  return redirect("/explore/profiles", { headers: response.headers });
};
