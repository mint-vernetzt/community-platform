import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { badRequest } from "remix-utils";
import { setSession } from "~/auth.server";
import { updateProfileByUserId } from "~/profile.server";

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
      supabaseClient,
      accessToken,
      refreshToken
    );
    if (sessionUser !== null && sessionUser.email !== undefined) {
      // Update email on public profile table
      const profile = await updateProfileByUserId(sessionUser.id, {
        email: sessionUser.email,
      });
      // Default redirect to profile of sessionUser after sign up confirmation
      return redirect(`/profile/${profile.username}`, {
        headers: response.headers,
      });
    } else {
      throw badRequest({
        message:
          "Request not from confirmation link or confirmation link expired.",
      });
    }
  } else {
    throw badRequest({
      message:
        "Request not from confirmation link or confirmation link expired.",
    });
  }
};
