import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import React from "react";
import { getSession } from "~/auth.server";

type LoaderData = {
  hasSession: boolean;
};

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

  const session = await getSession(supabaseClient);
  const hasSession = session !== null;

  return json<LoaderData>({ hasSession }, { headers: response.headers });
};

export default function Index() {
  const submit = useSubmit();
  const loaderData = useLoaderData<LoaderData>();
  const [urlSearchParams] = useSearchParams();

  // Access point for confirmation links
  // Must be called on the client because hash parameters can only be accessed from the client
  React.useEffect(() => {
    const urlHashParams = new URLSearchParams(window.location.hash.slice(1));
    const type = urlHashParams.get("type");
    const accessToken = urlHashParams.get("access_token");
    const loginRedirect = urlSearchParams.get("login_redirect");

    if (accessToken !== null) {
      if (type === "signup") {
        submit(loginRedirect ? { login_redirect: loginRedirect } : null, {
          action: "/login",
        });
        return;
      }
    }

    // Redirect when user is logged in
    // Remove the else case when the landing page is implemented in this route
    if (loaderData.hasSession) {
      submit(null, { action: "/explore" });
      return;
    } else {
      submit(null, { action: "/explore" });
      return;
    }
  }, [submit, loaderData.hasSession, urlSearchParams]);

  return null;
}
