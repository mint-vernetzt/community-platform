import { captureException } from "@sentry/node";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect, type ActionFunctionArgs } from "react-router";
import { createAuthClient, resetInactivityReminderState } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { isBotRequest } from "~/utils.server";
import { createProfile, sendWelcomeMail } from "../register/utils.server";
import { getNumberOfGuestsByEmail } from "./verify.server";
import { checkHoneypot } from "~/honeypot.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  if (process.env.NODE_ENV !== "test") {
    await checkHoneypot(formData);
    const isBot = isBotRequest(request.headers.get("user-agent"));
    invariantResponse(
      isBot === false,
      "Bots are not allowed to access this resource",
      { status: 403 }
    );
  }

  const token_hash = formData.get("token_hash");
  const type = formData.get("type") as EmailOtpType | null;
  invariantResponse(
    token_hash !== null && type !== null && typeof token_hash === "string",
    "Bad request",
    {
      status: 400,
    }
  );
  invariantResponse(type === "signup" || type === "recovery", "Bad request", {
    status: 400,
  });
  const { authClient, headers } = createAuthClient(request);
  const { error, data } = await authClient.auth.verifyOtp({
    type,
    token_hash,
  });
  let loginRedirect = formData.get("login_redirect");
  // Supabase defaults the login redirect to "/" if not specified so this will overwrite this behaviour
  if (
    loginRedirect === process.env.COMMUNITY_BASE_URL ||
    (loginRedirect !== null &&
      typeof loginRedirect === "string" &&
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
    sendWelcomeMail({
      profile,
      locales: {
        mail: {
          subject: {
            de: languageModuleMap["de"]["auth/verify"].welcomeEmail.subject,
            en: languageModuleMap["en"]["auth/verify"].welcomeEmail.subject,
          },
        },
      },
    }).catch((error) => {
      captureException(error);
    });

    let loginRedirectUrl;
    if (loginRedirect !== null && typeof loginRedirect === "string") {
      loginRedirectUrl = new URL(loginRedirect, request.url);
    } else {
      loginRedirectUrl = new URL(`/profile/${profile.username}`, request.url);
    }

    const numberOfGuests = await getNumberOfGuestsByEmail(profile.email);
    if (numberOfGuests > 0) {
      loginRedirectUrl.searchParams.set("modal-guests-exist", "true");
    }

    return redirect(
      `${loginRedirectUrl.pathname}?${loginRedirectUrl.searchParams.toString()}`,
      {
        headers,
      }
    );
  }
  if (type === "recovery") {
    await resetInactivityReminderState(user.id);
    return redirect(
      `/reset/set-password${
        loginRedirect !== null ? `?login_redirect=${loginRedirect}` : ""
      }`,
      { headers }
    );
  }
}
