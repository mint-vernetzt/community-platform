import { Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { deriveMode, getEventBySlugOrThrow } from "./utils.server";

type LoaderData = {
  mode: Awaited<ReturnType<typeof deriveMode>>;
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>;
  abilities: Awaited<ReturnType<typeof getFeatureAbilities>>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  const { slug } = params;

  if (slug === undefined || typeof slug !== "string") {
    throw badRequest({ message: '"slug" missing' });
  }

  const currentUser = await getUserByRequest(request);
  const event = await getEventBySlugOrThrow(slug);

  const mode = await deriveMode(event, currentUser);
  const abilities = await getFeatureAbilities(request, "events");

  return { mode, event, abilities };
};

function Index() {
  const loaderData = useLoaderData<LoaderData>();
  return (
    <>
      <h1>Slug: {loaderData.event.slug}</h1>
      {loaderData.mode === "owner" &&
        loaderData.abilities.events.hasAccess === true && (
          <Link
            className="btn btn-outline btn-primary"
            to={`/event/${loaderData.event.slug}/settings`}
          >
            Veranstaltung bearbeiten
          </Link>
        )}
    </>
  );
}

export default Index;
