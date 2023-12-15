import { redirect, type LoaderFunctionArgs, json } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const url = new URL(request.url);
  const loginRedirect = url.searchParams.get("login_redirect");
  const authClient = createAuthClient(request, response);
  const { error, data } = await authClient.auth.signInWithOAuth({
    provider: "keycloak",
    options: {
      scopes: "openid",
      redirectTo: `${
        process.env.COMMUNITY_BASE_URL || ""
      }/auth/keycloak/callback${
        loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
      }`,
    },
  });
  if (error) {
    console.log(error);
    return json({ message: error.message }, { status: 500 });
  }

  return redirect(data.url);
};
