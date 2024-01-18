import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { createAuthClient, setSession } from "~/auth.server";
import { updateProfileByUserId } from "./set-email.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.searchParams);
  const accessToken = urlSearchParams.get("access_token");
  const refreshToken = urlSearchParams.get("refresh_token");
  const type = urlSearchParams.get("type");

  if (
    accessToken !== null &&
    refreshToken !== null &&
    type === "email_change"
  ) {
    // This automatically logs in the user
    // Throws error on invalid refreshToken, accessToken combination
    const { user: sessionUser } = await setSession(
      authClient,
      accessToken,
      refreshToken
    );
    if (sessionUser !== null && sessionUser.email !== undefined) {
      // Update email on public profile table
      const profile = await updateProfileByUserId(sessionUser.id, {
        email: sessionUser.email,
      });
      // Default redirect to profile of sessionUser after set email
      return redirect(`/profile/${profile.username}`);
    } else {
      throw json(
        {
          message:
            "Could not set the session. Either the access and refresh token combination is invalid or an internal server occured.",
        },
        { status: 500 }
      );
    }
  } else {
    throw json(
      {
        message:
          "Request not from confirmation link or confirmation link expired.",
      },
      { status: 400 }
    );
  }
};
