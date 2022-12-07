import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";

// handle "/general" as default route
export const loader: LoaderFunction = async (args) => {
  const { params, request } = args;
  const response = new Response();
  createAuthClient(request, response);
  return redirect(`/event/${params.slug}/settings/general`, {
    headers: response.headers,
  });
};
