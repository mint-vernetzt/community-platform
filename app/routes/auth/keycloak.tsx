import { type LoaderArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import React from "react";

export const loader = async (args: LoaderArgs) => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };

  return json({ env });
};

function Keycloak() {
  const { env } = useLoaderData<typeof loader>();
  const [supabase] = React.useState(() =>
    createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  );

  React.useEffect(() => {
    async function signIn() {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "keycloak",
        options: {
          scopes: "openid",
          redirectTo: "http://localhost:3000/auth/keycloak/callback",
          queryParams: {
            login_redirect: "/dashboard", // TODO: pass login_redirect from request
          },
        },
      });
      if (error) {
        console.log(error);
      }
    }
    signIn();
  }, [supabase]);

  return null;
}

export default Keycloak;
