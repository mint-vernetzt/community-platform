import { LoaderFunction, redirect } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import React from "react";
import { getSession } from "~/auth.server";

export const loader: LoaderFunction = async (args) => {
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

  // Remove this if the landing page should be accessible for logged in users
  const session = await getSession(supabaseClient);
  if (session !== null) {
    return redirect("/explore", { headers: response.headers });
  }

  // Remove this when landing page is designed
  // This is the default redirect to /explore if someone visits this landing page
  if (session === null) {
    return redirect("/explore", { headers: response.headers });
  }

  return response;
};

export default function Index() {
  const submit = useSubmit();

  // TODO: Make this to the access point of all confirmation links
  // Check if we still need the accessToken
  // If yes -> slice it from hash (use getAccessTokenFromHash() in lib)
  // redirect to this route and do all following operations in this loader (redirect, email change on user, etc...)
  // If no -> Remove below code and redirect right to the wanted location inside the loader (depending on type in urlParams)
  React.useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.hash.slice(1));
    const type = urlSearchParams.get("type");
    const accessToken = urlSearchParams.get("access_token");

    if (accessToken !== null) {
      if (type === "email_change") {
        submit({ type, access_token: accessToken }, { action: "/login?index" }); // TODO: maybe we can automatically log in user
        return;
      }
    }
  }, [submit]);

  return null;
}
