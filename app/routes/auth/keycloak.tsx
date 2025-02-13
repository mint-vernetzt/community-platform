import { redirect, type LoaderFunctionArgs } from "react-router";
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
  invariantResponse(error === null, "Server error", { status: 500 });

  return redirect(data.url, { headers });
};
