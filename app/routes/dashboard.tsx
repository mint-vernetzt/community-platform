import { LoaderArgs, redirect } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ProfileCard from "common/components/src/organisms/cards/ProfileCard";
import { useTransition } from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const featureAbilities = await getFeatureAbilities(authClient, "dashboard");
  if (featureAbilities["dashboard"].hasAccess === false) {
    return redirect("/");
  }

  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirect("/login");
  }

  return json({}, { headers: response.headers });
};

function Dashboard() {
  const loaderData = useLoaderData<typeof loader>();
  const transition = useTransition();

  return (
    <>
      <section className="py-16 lg:py-24 relative">
        <div className="container relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            hello
          </div>
        </div>
      </section>
    </>
  );
}

export default Dashboard;
