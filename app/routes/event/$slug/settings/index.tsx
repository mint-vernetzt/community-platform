import { createServerClient } from "@supabase/auth-helpers-remix";
import { LoaderFunction, redirect } from "@remix-run/node";

// handle "/general" as default route
export const loader: LoaderFunction = async (args) => {
  const { params, request } = args;
  const response = new Response();
  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    request,
    response,
  });
  return redirect(`/event/${params.slug}/settings/general`, {
    headers: response.headers,
  });
};
