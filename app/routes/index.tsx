import React from "react";
import { LoaderFunction, redirect, useLoaderData, useSubmit } from "remix";
import { authenticator, sessionStorage } from "~/auth.server";

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const sessionValue = session.get(authenticator.sessionKey);
  const hasSession = sessionValue !== undefined;

  return { hasSession };
};

export default function Index() {
  const submit = useSubmit();
  const loaderData = useLoaderData();

  // TODO: Move this inside the loader and get url params from request.url ?
  React.useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.hash.slice(1));
    const type = urlSearchParams.get("type");
    const accessToken = urlSearchParams.get("access_token");

    if (accessToken !== null) {
      if (type === "signup" || type === "email_change") {
        submit({ type, access_token: accessToken }, { action: "/login?index" }); // TODO: maybe we can automatically log in user
        return;
      } else if (type === "recovery") {
        submit(
          { access_token: accessToken },
          { action: "/reset/set-password" }
        );
        return;
      }
    }
    if (loaderData.hasSession) {
      submit(null, { action: "/explore" });
    }
    // TODO: Remove submit in else case when the landing page is designed and implemented
    else {
      submit(null, { action: "/explore" });
    }
  }, [loaderData]);

  return null;
}
