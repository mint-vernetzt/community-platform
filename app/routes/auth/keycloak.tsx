import { redirect, type LoaderFunctionArgs, json } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const { authClient, headers } = createAuthClient(request);
  invariantResponse(
    process.env.COMMUNITY_BASE_URL !== undefined,
    "Server error",
    { status: 500 }
  );
  const loginRedirect = url.searchParams.get("login_redirect");
  // if (
  //   loginRedirect !== null &&
  //   !loginRedirect.startsWith(process.env.COMMUNITY_BASE_URL)
  // ) {
  //   loginRedirect = `${process.env.COMMUNITY_BASE_URL}${loginRedirect}`;
  // }
  console.log("LOGIN REDIRECT IN CALLER", loginRedirect);
  const { error, data } = await authClient.auth.signInWithOAuth({
    provider: "keycloak",
    options: {
      scopes: "openid",
      redirectTo: `${process.env.COMMUNITY_BASE_URL}/auth/keycloak/callback${
        loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
      }`,
      // queryParams: loginRedirect
      //   ? {
      //       login_redirect: loginRedirect,
      //     }
      //   : undefined,
    },
  });
  if (error) {
    console.log(error);
    return json({ message: error.message }, { status: 500 });
  }

  return redirect(data.url, { headers });
};
