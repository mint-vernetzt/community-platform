import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";

// handle "/general" as default route
export const loader = async (args: LoaderFunctionArgs) => {
  const { params, request } = args;
  const { response } = createAuthClient(request);
  return redirect(`/event/${params.slug}/settings/general`, {
    headers: response.headers,
  });
};
