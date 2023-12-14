import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";

// handle "/general" as default route
export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  createAuthClient(request, response);

  const username = getParamValueOrThrow(params, "username");

  return redirect(`/profile/${username}/settings/general`, {
    headers: response.headers,
  });
};
