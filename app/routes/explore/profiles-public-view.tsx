import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

import { useLoaderData } from "@remix-run/react";
import { prismaClient } from "~/prisma";

export async function loader(args: LoaderArgs) {
  console.time("loader profile-public-query");

  // To use this follow these steps to create a view in the prisma schema
  // https://www.prisma.io/docs/concepts/components/prisma-schema/views#query-views-in-prisma-client
  // const profiles = await prismaClient.publicProfile.findMany({
  //   select: {
  //     id: true,
  //     username: true,
  //   },
  //   take: 10,
  // });
  const profiles: any[] = [];

  console.timeEnd("loader profile-public-query");

  return json({ profiles });
}

export default function Public() {
  const loaderData = useLoaderData<typeof loader>();
  const { profiles } = loaderData;

  return (
    <>
      {profiles.map((profile) => {
        return (
          <div key={profile.id}>
            <h1>{profile.username}</h1>
            <pre className="text-xs monospace">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        );
      })}
    </>
  );
}
