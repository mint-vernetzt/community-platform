import { LoaderFunction, redirect } from "@remix-run/node";
import { createServerClient } from "@supabase/auth-helpers-remix";

// handle "/general" as default route
export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();

  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    request,
    response,
  });
  return redirect(`/organization/${params.slug}/settings/general`, {
    headers: response.headers,
  });
};
