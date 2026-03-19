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
  let loginRedirect = url.searchParams.get("login_redirect");
  if (
    loginRedirect !== null &&
    !loginRedirect.startsWith(process.env.COMMUNITY_BASE_URL)
  ) {
    loginRedirect = `${process.env.COMMUNITY_BASE_URL}${loginRedirect}`;
  }
  const { error, data } = await authClient.auth.signInWithOAuth({
    provider: "keycloak",
    options: {
      scopes: "openid",
      redirectTo: `${process.env.COMMUNITY_BASE_URL}/auth/keycloak/callback${
        loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
      }`,
    },
  });
  invariantResponse(error === null, "Server error", { status: 500 });

  const response = await fetch(data.url, { redirect: "manual" });

  invariantResponse(
    response.status === 301 || response.status === 302,
    "Server error - OAuth redirect failed",
    { status: 500 }
  );

  const keycloakUrl = response.headers.get("location");

  invariantResponse(
    keycloakUrl !== null,
    "Server error - No redirect location received",
    { status: 500 }
  );

  invariantResponse(
    keycloakUrl.startsWith(process.env.KEYCLOAK_URL),
    "Server error - Unexpected redirect destination",
    { status: 500 }
  );

  return redirect(keycloakUrl, { headers });
};
