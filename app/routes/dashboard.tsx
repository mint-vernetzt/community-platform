import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ProfileCard from "common/components/src/organisms/cards/ProfileCard";
import { useTransition } from "react";
import { createAuthClient } from "~/auth.server";

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
      <ProfileCard />
    </>
  );
}

export default Dashboard;
