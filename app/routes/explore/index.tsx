import { createServerClient } from "@supabase/auth-helpers-remix";
import { LoaderFunction, redirect } from "@remix-run/node";

// handle "/profiles" as default route
export const loader: LoaderFunction = async ({ request }) => {
  const response = new Response();
  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    request,
    response,
  });
  return redirect("/explore/profiles", { headers: response.headers });
};
