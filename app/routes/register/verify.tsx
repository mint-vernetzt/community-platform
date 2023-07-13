import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { badRequest } from "remix-utils";
import { createAuthClient, setSession } from "~/auth.server";
import { createProfile } from "./utils.server";

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
          throw badRequest(
            "Did not provide necessary user meta data to create a corresponding profile after sign up."
          );
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
        alert(
          "Das Profil konnte nicht erstellt werden. Bitte mit Screenshot dieser Nachricht an den Support wenden.\n\nSession konnte nach der Bestätigungsmail nicht gesetzt werden."
        );
        throw badRequest(
          "Could not create a session after sign up verification."
        );
      }
    }
  }

  return json(null, { headers: response.headers });
};
