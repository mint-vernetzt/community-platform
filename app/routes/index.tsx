import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
import React from "react";
import { createAuthClient, getSession } from "~/auth.server";

type LoaderData = {
  hasSession: boolean;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const session = await getSession(authClient);
  const hasSession = session !== null;

  return json<LoaderData>({ hasSession }, { headers: response.headers });
};

export default function Index() {
  const submit = useSubmit();
  const loaderData = useLoaderData<LoaderData>();
  const [urlSearchParams] = useSearchParams();

  // Access point for confirmation links
  // Must be called on the client because hash parameters can only be accessed from the client
  React.useEffect(() => {
    const urlHashParams = new URLSearchParams(window.location.hash.slice(1));
    const type = urlHashParams.get("type");
    const accessToken = urlHashParams.get("access_token");
    const refreshToken = urlHashParams.get("refresh_token");
    const loginRedirect = urlSearchParams.get("login_redirect");
    const error = urlHashParams.get("error");
    const errorCode = urlHashParams.get("error_code");
    const errorDescription = urlSearchParams.get("error_description");

    if (accessToken !== null && refreshToken !== null) {
      if (type === "signup") {
        submit(
          loginRedirect
            ? {
                login_redirect: loginRedirect,
                access_token: accessToken,
                refresh_token: refreshToken,
                type: type,
              }
            : {
                access_token: accessToken,
                refresh_token: refreshToken,
                type: type,
              },
          {
            action: "/login",
          }
        );
        return;
      }
      if (type === "recovery") {
        submit(
          loginRedirect
            ? {
                login_redirect: loginRedirect,
                access_token: accessToken,
                refresh_token: refreshToken,
              }
            : { access_token: accessToken, refresh_token: refreshToken },
          {
            action: "/reset/set-password",
          }
        );
        return;
      }
      if (type === "email_change") {
        submit(
          {
            access_token: accessToken,
            refresh_token: refreshToken,
            type: type,
          },
          {
            action: "/reset/set-email",
          }
        );
        return;
      }
      if (error !== null && errorCode !== null && errorDescription !== null) {
        alert(
          `Es ist ein Fehler mit dem Bestätigungslink aufgetreten. Das tut uns Leid. Bitte wende dich mit den folgenden Daten an den Support:\n${error}\n${errorDescription}\n${errorCode}`
        );
        return;
      }
    }

    // Redirect when user is logged in
    // Remove the else case when the landing page is implemented in this route
    if (loaderData.hasSession) {
      submit(null, { action: "/explore?reason=1" });
      return;
    } else {
      submit(null, { action: "/explore?reason=2" });
      return;
    }
  }, [submit, loaderData.hasSession, urlSearchParams]);

  return null;
}
