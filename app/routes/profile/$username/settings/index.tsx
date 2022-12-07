import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { getParamValueOrThrow } from "~/lib/utils/routes";

// handle "/general" as default route
export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();

  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    request,
    response,
  });

  const username = getParamValueOrThrow(params, "username");

  return redirect(`/profile/${username}/settings/general`, {
    headers: response.headers,
  });
};
