import { GravityType } from "imgproxy/dist/types";
import { Link, LoaderFunction, useLoaderData } from "remix";
import { H1, H3, H4 } from "~/components/Heading/Heading";
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
      <section className="container my-8 md:my-10 lg:my-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 items-stretch">
        {loaderData.projects.map((project) => {
          return (
            <div
              key={`project-${project.id}`}
              className="rounded-2xl bg-white shadow-xl flex flex-col border"
            >
              <Link
                className="relative flex-initial"
                to={`/project/${project.slug}`}
              >
                <div className="w-full aspect-4/3 lg:aspect-video rounded-t-2xl hidden">
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
              </Link>
              <Link
                to={`/project/${project.slug}`}
                className="flex flex-nowrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200"
              >
                <div>
                  <div className="w-full flex items-center flex-row">
                    {project.logo !== "" && project.logo !== null ? (
                      <div className="h-11 w-11 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                        <img
                          className="max-w-full w-auto max-h-16 h-auto"
                          src={project.logo}
                          alt={project.name}
                        />
                      </div>
                    ) : (
                      <div className="h-11 w-11 bg-primary text-white text-xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                        {getInitialsOfName(project.name)}
                      </div>
                    )}
                    <div className="pl-4">
                      <H3 like="h4" className="text-base mb-0 font-bold">
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
                    <div className="mt-2 line-clamp-3 text-sm">
                      {project.excerpt}
                    </div>
                  )}
                </div>
                {project.awards.length > 0 && (
                  <div className="-mt-4 flex ml-4">
                    {project.awards.map(({ award }) => {
                      award.date = new Date(award.date);
                      return (
                        <div
                          key={`award-${award.id}`}
                          className="bg-[url('/images/award_bg.svg')] -mt-px bg-cover bg-no-repeat bg-left-top drop-shadow-lg aspect-[11/17] pb-[25%]"
                        >
                          <div className="flex flex-col items-center justify-center min-w-[57px] h-full pt-2">
                            <div className="h-8 w-8 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                              {award.logo !== null && award.logo !== "" ? (
                                <img src={award.logo} alt={award.title} />
                              ) : (
                                getInitialsOfName(award.title)
                              )}
                            </div>
                            <div className="px-2 pt-1">
                              <H4
                                like="h4"
                                className="text-xxs mb-0 text-center text-neutral-600 font-bold leading-none"
                              >
                                {award.shortTitle}
                              </H4>
                              <p className="text-xxs text-center leading-none">
                                {award.date.getFullYear()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Link>

              <div className="items-end px-4">
                <div className="py-4 border-t text-right">
                  <Link
                    to={`/project/${project.slug}`}
                    className="btn btn-primary btn-small"
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
