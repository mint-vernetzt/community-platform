import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
      {/* <Layout> should be top level in root.tsx */}
      <Layout>
        <Heading></Heading>
        {/* Container component for multiple buttons? */}
        <Button></Button>
        <Button></Button>
        <CommunityCounter></CommunityCounter>
        <Heading></Heading>
        <Slider>
          {/* MAP! */}
          <ProfileCard></ProfileCard>
        </Slider>
        <Slider>
          {/* MAP! */}
          <OrganizationCard></OrganizationCard>
        </Slider>
        <Slider>
          {/* MAP! */}
          <EventCard></EventCard>
        </Slider>
      </Layout>
    </>
  );
}

export default Dashboard;
