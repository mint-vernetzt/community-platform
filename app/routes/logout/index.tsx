import { ActionFunction, redirect } from "@remix-run/node";
import { createServerClient } from "@supabase/auth-helpers-remix";

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    request,
    response,
  });

  // TODO: Rework logout
  // Check if the cookie is cleared in the response
  // await authenticator.logout(request, { redirectTo: "/login" });

  return redirect("/login", { headers: response.headers });
};
