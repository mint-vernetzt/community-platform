import { Link, LoaderFunction, Outlet, useLoaderData } from "remix";
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
    <div className="container relative pb-44">
      <div className="flex flex-col lg:flex-row -mx-4 pt-10 lg:pt-0">
        <ul>
          <li>
            <Link to="./profiles">Profiles</Link>
          </li>
          <li>
            <Link to="./organizations">Organizations</Link>
          </li>
          {loaderData.abilities.events.hasAccess && (
            <li>
              <Link to="./events">Events</Link>
            </li>
          )}
        </ul>
      </div>
      <div className="basis-6/12 px-4">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Explore;
