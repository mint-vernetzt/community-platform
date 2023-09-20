import { redirect, type LoaderArgs } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import React from "react";
import { redirectWithAlert } from "~/alert.server";
import {
  createAdminAuthClient,
  createAuthClient,
  getSession,
  setSession,
} from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { generateValidSlug } from "~/utils.server";

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.searchParams);
  const loginRedirect = urlSearchParams.get("login_redirect");

  // check if user is already logged in and redirect to dashboard or login_redirect
  const session = await getSession(authClient);
  if (session !== null) {
    return redirect(loginRedirect || "/dashboard", {
      headers: response.headers,
    });
  }

  // login user using access_token and refresh_token
  const accessToken = urlSearchParams.get("access_token");
  const refreshToken = urlSearchParams.get("refresh_token");
  let profile;
  let firstLogin = false;
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
        // if profile is not created, this is the first login
        firstLogin = true;

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
            profileVisibility: {
              create: {},
            },
          },
        });
      } else {
        // TODO: remove legacy visibility creation in next version (needed during development)
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
      // Redirect after sign up verification
      const defaultRedirect = firstLogin
        ? `/profile/${profile.username}`
        : "/dashboard";
      return redirect(loginRedirect || defaultRedirect, {
        headers: response.headers,
      });
    }
    // check if user registered with email and wants to sign in with keycloak
    else if (
      user !== null &&
      user.app_metadata.provider === "email" &&
      user.app_metadata.providers.includes("keycloak")
    ) {
      // changes provider of user to keycloak
      const adminAuthClient = createAdminAuthClient();
      await adminAuthClient.auth.admin.updateUserById(user.id, {
        app_metadata: {
          provider: "keycloak",
        },
      });
      return redirectWithAlert(
        loginRedirect || "/dashboard",
        {
          message:
            "Deine MINT-ID wurde erfolgreich mit Deinem Profil verknüpft.",
        },
        {
          headers: response.headers,
        }
      );
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
