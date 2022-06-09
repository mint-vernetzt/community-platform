import React from "react";
import { Link, LoaderFunction, redirect, useSubmit } from "remix";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { supabaseStrategy } from "../auth.server";

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const session = await supabaseStrategy.checkSession(request);

  if (session !== null) {
    return redirect("/explore");
  }

  return { session };
};

export default function Index() {
  const submit = useSubmit();

  React.useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.hash.slice(1));
    const type = urlSearchParams.get("type");
    const accessToken = urlSearchParams.get("access_token");

    if (accessToken !== null) {
      if (type === "signup") {
        submit(null, { action: "/login?index" }); // TODO: maybe we can automatically log in user
      }
      if (type === "recovery") {
        submit(
          { access_token: accessToken },
          { action: "/reset/set-password" }
        );
      }
    }
  });

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
