import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type { ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma";
import { filterProfileDataByVisibilitySettings } from "./utils.server";

export const loader = async (args: LoaderArgs) => {
  console.time("loader profile-public-programmatically");

  // const rawProfiles = await prismaClient.profile.findMany({
  //   select: {
  //     id: true,
  //     username: true,
  //   },
  //   take: 20,
  // });
  const rawProfiles = await prismaClient.profile.findMany({
    include: {
      areas: true,
      memberOf: true,
      offers: true,
      participatedEvents: true,
      seekings: true,
      contributedEvents: true,
      teamMemberOfEvents: true,
      teamMemberOfProjects: true,
      waitingForEvents: true,
    },
    take: 20,
  });

  const filteredProfiles = await filterProfileDataByVisibilitySettings<
    ArrayElement<typeof rawProfiles>
  >(rawProfiles);

  console.timeEnd("loader profile-public-programmatically");
  return json({ profiles: filteredProfiles });
};

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
