import { redirect } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { serverError } from "remix-utils";
import { signOut } from "~/auth.server";

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );

  const { error } = await signOut(supabaseClient);

  if (error !== null) {
    throw serverError({ message: error.message });
  }

  return redirect("/login", { headers: response.headers });
};
