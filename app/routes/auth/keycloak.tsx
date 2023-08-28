import { type DataFunctionArgs, redirect } from "@remix-run/node";
import { serverError } from "remix-utils";
import { createAuthClient } from "~/auth.server";

export const loader = async ({ request }: DataFunctionArgs) => {
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
    return serverError({ message: error.message });
  }

  return redirect(data.url);
};
