import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import React from "react";

export const loader = async () => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    COMMUNITY_BASE_URL: process.env.COMMUNITY_BASE_URL || "",
  };

  return json({ env });
};

function Keycloak() {
  const { env } = useLoaderData<typeof loader>();
  const [supabase] = React.useState(() =>
    createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  );
  const [urlSearchParams] = useSearchParams();

  React.useEffect(() => {
    async function signIn() {
      const loginRedirect = urlSearchParams.get("login_redirect");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "keycloak",
        options: {
          scopes: "openid",
          redirectTo: `${env.COMMUNITY_BASE_URL}/auth/keycloak/callback${
            loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
          }`,
        },
      });
      if (error) {
        console.log(error);
      }
    }
    signIn();
  }, [supabase, urlSearchParams, env.COMMUNITY_BASE_URL]);

  return null;
}

export default Keycloak;
