import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";

// handle "/general" as default route
export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const { response } = createAuthClient(request);
  return redirect(`/organization/${params.slug}/settings/general`, {
    headers: response.headers,
  });
};
