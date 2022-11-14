import { GravityType } from "imgproxy/dist/types";
import { Link, LoaderFunction, useLoaderData } from "remix";
import { H1, H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getPublicURL } from "~/storage.server";
import { getAllProjects } from "./utils.server";

type LoaderData = {
  projects: Awaited<ReturnType<typeof getAllProjects>>;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  await checkFeatureAbilitiesOrThrow(request, "projects");

  const projects = await getAllProjects();

  const enhancedProjects = projects.map((project) => {
    let enhancedProject = project;
    if (enhancedProject.background !== null) {
      const publicURL = getPublicURL(enhancedProject.background);
      if (publicURL) {
        enhancedProject.background = getImageURL(publicURL, {
          resize: { type: "fit", width: 400, height: 280 },
        });
      }
    }
    if (enhancedProject.logo !== null) {
      const publicURL = getPublicURL(enhancedProject.logo);
      if (publicURL) {
        enhancedProject.logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 144, height: 144 },
        });
      }
    }
    enhancedProject.awards = enhancedProject.awards.map((relation) => {
      if (relation.award.logo !== null) {
        const publicURL = getPublicURL(relation.award.logo);
        if (publicURL !== null) {
          relation.award.logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return relation;
    });
    return enhancedProject;
  });

  return {
    projects: enhancedProjects,
  };
};

function Projects() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Finde inspirierende Projekte</H1>
        <p className="">
          Hier kannst du einen Blick auf verschiedene Projekte der
          MINT-Community werfen.
        </p>
      </section>
      <section className="container my-8 md:my-10 lg:my-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {loaderData.projects.map((project) => {
          return (
            <div
              key={`project-${project.id}`}
              className="rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden"
            >
              <Link
                className="relative flex-initial"
                to={`/project/${project.slug}`}
              >
                <div className="w-full aspect-4/3 lg:aspect-video">
                  {project.background !== undefined && (
                    <img
                      src={
                        project.background ||
                        "/images/default-event-background.jpg"
                      }
                      alt={project.name}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                {project.awards.length > 0 &&
                  project.awards.map(({ award }) => (
                    <div key={award.id}>
                      <div className="h-8 w-8 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                        <img
                          className="max-w-full w-auto max-h-8 h-auto"
                          src={award.logo}
                          alt={award.title}
                        />
                      </div>
                      <p>{award.title}</p>
                      <p>{award.subline}</p>
                    </div>
                  ))}
              </Link>
              <Link
                to={`/project/${project.slug}`}
                className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200"
              >
                <div className="w-full flex items-center flex-row">
                  {project.logo !== "" && project.logo !== null ? (
                    <div className="h-16 w-16 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                      <img
                        className="max-w-full w-auto max-h-16 h-auto"
                        src={project.logo}
                        alt={project.name}
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                      {getInitialsOfName(project.name)}
                    </div>
                  )}
                  <div className="pl-4">
                    <H3 like="h4" className="text-xl mb-1">
                      {project.name}
                    </H3>
                    {project.responsibleOrganizations &&
                      project.responsibleOrganizations.length > 0 && (
                        <p className="font-bold text-sm">
                          {project.responsibleOrganizations
                            .map(({ organization }) => organization.name)
                            .join(" / ")}
                        </p>
                      )}
                  </div>
                </div>
                {project.excerpt !== null && project.excerpt !== "" && (
                  <div className="mt-2 line-clamp-3">{project.excerpt}</div>
                )}
              </Link>

              <div className="flex flex-initial items-center p-4">
                <div className="ml-auto">
                  <Link
                    to={`/project/${project.slug}`}
                    className="btn btn-outline btn-primary"
                  >
                    Zum Projekt
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

export default Projects;
