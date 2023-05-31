import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { createAuthClient, setSession } from "~/auth.server";
import { getProfileByUserId } from "~/profile.server";

export const loader = async (args: LoaderArgs) => {
  const { request } = args;

  const response = new Response();

  const authClient = createAuthClient(request, response);

  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.searchParams);
  const loginRedirect = urlSearchParams.get("login_redirect");
  const accessToken = urlSearchParams.get("access_token");
  const refreshToken = urlSearchParams.get("refresh_token");
  const type = urlSearchParams.get("type");

  if (accessToken !== null && refreshToken !== null) {
    // This automatically logs in the user
    // Throws error on invalid refreshToken, accessToken combination
    const { user: sessionUser } = await setSession(
      authClient,
      accessToken,
      refreshToken
    );
    if (type === "signup" && sessionUser !== null) {
      // Default redirect to profile of sessionUser after sign up confirmation
      const profile = await getProfileByUserId(sessionUser.id, ["username"]);
      return redirect(loginRedirect || `/profile/${profile.username}`, {
        headers: response.headers,
      });
    }
  }

  return json(null, { headers: response.headers });
};
