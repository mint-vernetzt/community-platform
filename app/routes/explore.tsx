import { LoaderFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { getFeatureAbilities } from "~/lib/utils/application";

type LoaderData = {
  abilities: ReturnType<Awaited<typeof getFeatureAbilities>>;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const abilities = await getFeatureAbilities(request, "events");

  return { abilities };
};

function Explore() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <div className="relative pb-44">
      <div className="">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Explore;
