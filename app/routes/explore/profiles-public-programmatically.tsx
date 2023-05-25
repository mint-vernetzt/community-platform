import type { LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

import { useLoaderData } from "@remix-run/react";
import {
  filterProfileDataByVisibilitySettings,
  getAllProfiles,
  getPaginationValues,
} from "./utils.server";

export const loader: LoaderFunction = async (args) => {
  console.time("loader profile-public-programmatically");
  const { request } = args;

  const rawProfiles = await getAllProfiles({
    skip: 0,
    take: 100,
    areaId: undefined,
    offerId: undefined,
    seekingId: undefined,
    randomSeed: 0,
  });

  const filteredProfiles = await filterProfileDataByVisibilitySettings(
    rawProfiles
  );
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
