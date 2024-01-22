import { redirect, type LoaderFunctionArgs, json } from "@remix-run/node";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createAuthClient } from "~/auth.server";
import { createProfile } from "../register/utils.server";
import { updateProfileEmailByUserId } from "./verify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  if (token_hash !== null && type !== null) {
    const { authClient, headers } = createAuthClient(request);
    const { error, data } = await authClient.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error === null && data.user !== null && data.session !== null) {
      const user = data.user;
      let loginRedirect = requestUrl.searchParams.get("login_redirect");
      if (type === "signup") {
        const profile = await createProfile(user);
        if (profile === null) {
          throw json(
            "Did not provide necessary user meta data to create a corresponding profile after sign up.",
            { status: 400 }
          );
        }
        // Supabase defaults the login redirect to "/" if not specified so this will overwrite this behaviour
        if (loginRedirect === process.env.COMMUNITY_BASE_URL) {
          loginRedirect = null;
        }
        return redirect(loginRedirect || `/profile/${profile.username}`, {
          headers,
        });
      } else if (type === "email_change") {
        if (user.email === undefined) {
          throw json({ message: "Server error" }, { status: 500 });
        }
        const profile = await updateProfileEmailByUserId(user.id, user.email);
        // Supabase defaults the login redirect to "/" if not specified so this will overwrite this behaviour
        if (loginRedirect === process.env.COMMUNITY_BASE_URL) {
          loginRedirect = null;
        }
        return redirect(loginRedirect || `/profile/${profile.username}`, {
          headers,
        });
      } else if (type === "recovery") {
        // TODO:
        // Could we reuse the profile/security set password route?
        // Dont forget to add login redirect
        // Supabase defaults the login redirect to "/" if not specified so this will overwrite this behaviour
        if (loginRedirect === process.env.COMMUNITY_BASE_URL) {
          loginRedirect = null;
        }
        return redirect("TODO", { headers });
      } else {
        throw json({ message: "Bad request" }, { status: 400 });
      }
    } else {
      throw json(
        { message: "Server Error during verification" },
        { status: 500 }
      );
    }
  }
  throw json({ message: "Bad request" }, { status: 400 });
}
