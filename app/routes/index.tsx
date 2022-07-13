import React from "react";
import { Link, LoaderFunction, useLoaderData, useSubmit } from "remix";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { authenticator, sessionStorage } from "../auth.server";

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
  }, [loaderData]);

  return (
    <header className="shadow-md mb-8">
      <div className="container relative z-10">
        <div className="px-4 pt-3 pb-3 flex flex-row items-center">
          <div>
            <Link to="/explore">
              <HeaderLogo />
            </Link>
          </div>
          <div className="ml-auto">
            <Link
              to="/login"
              className="text-primary font-bold hover:underline"
            >
              Anmelden
            </Link>{" "}
            /{" "}
            <Link
              to="/register"
              className="text-primary font-bold hover:underline"
            >
              Registrieren
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
