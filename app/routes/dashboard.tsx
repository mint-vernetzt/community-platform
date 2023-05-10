import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ProfileCard from "common/components/src/organisms/cards/ProfileCard";
import { useTransition } from "react";
import { createAuthClient } from "~/auth.server";
import Chip from "~/components/Chip/Chip";

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();

  createAuthClient(request, response);

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
            <ProfileCard />
            <ProfileCard />
            <ProfileCard />
          </div>
        </div>
      </section>
    </>
  );
}

export default Dashboard;
