import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { createAuthClient } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { createProfile, sendWelcomeMail } from "../register/utils.server";
import { updateProfileEmailByUserId } from "./verify.server";
import { captureException } from "@sentry/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  invariantResponse(token_hash !== null && type !== null, "Bad request", {
    status: 400,
  });
  invariantResponse(
    type === "signup" || type === "email_change" || type === "recovery",
    "Bad request",
    { status: 400 }
  );
  const { authClient, headers } = createAuthClient(request);
  const { error, data } = await authClient.auth.verifyOtp({
    type,
    token_hash,
  });
  let loginRedirect = requestUrl.searchParams.get("login_redirect");
  // Supabase defaults the login redirect to "/" if not specified so this will overwrite this behaviour
  if (
    loginRedirect === process.env.COMMUNITY_BASE_URL ||
    (loginRedirect !== null &&
      loginRedirect.startsWith(process.env.COMMUNITY_BASE_URL) === false &&
      loginRedirect.startsWith("/") === false)
  ) {
    loginRedirect = null;
  }
  if (
    error !== null &&
    (error.code === "otp_expired" ||
      error.message === "Email link is invalid or has expired")
  ) {
    return redirect(
      `/auth/request-confirmation?type=${type}${
        loginRedirect !== null ? `&login_redirect=${loginRedirect}` : ""
      }`
    );
  }
  invariantResponse(
    error === null && data.user !== null && data.session !== null,
    "Server Error during verification",
    { status: 500 }
  );
  const user = data.user;
  if (type === "signup") {
    const profile = await createProfile(user);
    invariantResponse(
      profile !== null,
      "Did not provide necessary user meta data to create a corresponding profile after sign up.",
      { status: 400 }
    );
    sendWelcomeMail(profile).catch((error) => {
      captureException(error);
    });
    return redirect(loginRedirect || `/profile/${profile.username}`, {
      headers,
    });
  }
  if (type === "email_change") {
    invariantResponse(user.email !== undefined, "Server error", {
      status: 500,
    });
    const profile = await updateProfileEmailByUserId(user.id, user.email);
    return redirect(loginRedirect || `/profile/${profile.username}`, {
      headers,
    });
  }
  if (type === "recovery") {
    return redirect(
      `/reset/set-password${
        loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
      }`,
      { headers }
    );
  }
}
