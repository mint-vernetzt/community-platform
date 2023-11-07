import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { badRequest } from "remix-utils";
import { createAuthClient, getSessionUser, setSession } from "~/auth.server";
import { createProfile } from "./utils.server";
import i18next from "~/i18next.server";

export const loader = async (args: LoaderArgs) => {
  const { request } = args;

  const response = new Response();
  const t = await i18next.getFixedT(request, ["routes/register/verify"]);
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard", { headers: response.headers });
  }

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
    if (type === "signup") {
      if (sessionUser !== null) {
        // Create profile visibility settings after successful signup verification
        if (
          sessionUser.email === undefined ||
          sessionUser.user_metadata.username === undefined ||
          sessionUser.user_metadata.firstName === undefined ||
          sessionUser.user_metadata.lastName === undefined ||
          sessionUser.user_metadata.termsAccepted === undefined ||
          typeof sessionUser.user_metadata.username !== "string" ||
          typeof sessionUser.user_metadata.firstName !== "string" ||
          typeof sessionUser.user_metadata.lastName !== "string" ||
          typeof sessionUser.user_metadata.termsAccepted !== "boolean"
        ) {
          throw badRequest(t("error.badRequest1"));
        }
        // Profile is now created here and not inside a trigger function
        const initialProfile = {
          id: sessionUser.id,
          email: sessionUser.email,
          username: sessionUser.user_metadata.username,
          firstName: sessionUser.user_metadata.firstName,
          lastName: sessionUser.user_metadata.lastName,
          academicTitle: sessionUser.user_metadata.academicTitle,
          termsAccepted: sessionUser.user_metadata.termsAccepted,
        };
        const profile = await createProfile(initialProfile);
        // Default redirect to profile of sessionUser after sign up verification
        return redirect(loginRedirect || `/profile/${profile.username}`, {
          headers: response.headers,
        });
      } else {
        alert(t("error.profileCreate"));
        throw badRequest(t("error.badRequest2"));
      }
    }
  }

  return json(null, { headers: response.headers });
};
