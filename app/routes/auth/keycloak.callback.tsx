// import { redirect } from "@remix-run/node";
// import { createServerClient } from "@supabase/auth-helpers-remix";

import { useSubmit } from "@remix-run/react";
import { redirect, type LoaderArgs } from "@remix-run/node";
import React from "react";
import { createAuthClient, setSession } from "~/auth.server";
import { prismaClient } from "~/prisma";
import { generateValidSlug } from "~/utils";

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  // check if user is already logged in and redirect to dashboard or login_redirect

  // login user using access_token and refresh_token
  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.searchParams);
  const loginRedirect = urlSearchParams.get("login_redirect");
  const accessToken = urlSearchParams.get("access_token");
  const refreshToken = urlSearchParams.get("refresh_token");
  let profile;
  if (accessToken !== null && refreshToken !== null) {
    const { user } = await setSession(authClient, accessToken, refreshToken);
    if (
      user !== null &&
      user.email !== undefined &&
      user.user_metadata.full_name !== undefined &&
      typeof user.user_metadata.full_name === "string"
    ) {
      // check if profile exists
      profile = await prismaClient.profile.findFirst({
        where: { email: user.email },
        select: { id: true, username: true },
      });
      // if not, create profile
      if (profile === null) {
        const username = generateValidSlug(user.user_metadata.full_name);
        const fullNameParts = user.user_metadata.full_name.split(" ");
        // combine all parts except the last one to get the first name
        const firstName = fullNameParts.slice(0, -1).join(" ");
        // use the last part as last name
        const lastName = fullNameParts[fullNameParts.length - 1];
        profile = await prismaClient.profile.create({
          data: {
            id: user.id,
            email: user.email,
            username,
            firstName,
            lastName,
            termsAccepted: false,
          },
        });
        await prismaClient.profileVisibility.create({
          data: { profileId: profile.id },
        });
        // check if profile visibility exist
      } else {
        // check if profile is connected to session user
        if (profile.id !== user.id) {
          // if not, fail (later: ask if user wants to connect profile)
          throw new Error("Profile is connected to another user.");
        }
        // check if profile visibility exist
        const profileVisibility =
          await prismaClient.profileVisibility.findFirst({
            where: { profileId: profile.id },
          });
        // if not, create profile visibility
        if (profileVisibility === null) {
          await prismaClient.profileVisibility.create({
            data: { profileId: profile.id },
          });
        }
      }
      // Default redirect to profile of sessionUser after sign up verification
      return redirect(loginRedirect || `/profile/${profile.username}`, {
        headers: response.headers,
      });
    }
  }

  return null;
};

function KeycloakCallback() {
  const submit = useSubmit();

  React.useEffect(() => {
    const urlHashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = urlHashParams.get("access_token");
    const refreshToken = urlHashParams.get("refresh_token");
    if (accessToken !== null && refreshToken !== null) {
      submit({ access_token: accessToken, refresh_token: refreshToken });
    }
  }, [submit]);

  return null;
}

export default KeycloakCallback;
