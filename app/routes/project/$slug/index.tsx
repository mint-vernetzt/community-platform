import { Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { deriveMode, getProjectBySlugOrThrow } from "./utils.server";

type LoaderData = {
  mode: Awaited<ReturnType<typeof deriveMode>>;
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlugOrThrow>>>;
  abilities: Awaited<ReturnType<typeof checkFeatureAbilitiesOrThrow>>;
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const { slug } = params;

  if (slug === undefined || typeof slug !== "string") {
    throw badRequest({ message: '"slug" missing' });
  }

  const project = await getProjectBySlugOrThrow(slug);

  if (project === null) {
    throw notFound({ message: `Project not found` });
  }

  const currentUser = await getUserByRequest(request);

  const mode = await deriveMode(project, currentUser);

  const abilities = await checkFeatureAbilitiesOrThrow(request, "projects");

  return { mode, slug, project, abilities };
};

function Index() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <H1 like="h0">{loaderData.project.name}</H1>
      {loaderData.mode === "owner" && loaderData.abilities.projects.hasAccess && (
        <div className="bg-accent-white p-8 pb-0">
          <p className="font-bold text-right">
            <Link
              className="btn btn-outline btn-primary ml-4"
              to={`/project/${loaderData.project.slug}/settings`}
            >
              Projekt bearbeiten
            </Link>
          </p>
        </div>
      )}
    </>
  );
}

export default Index;
