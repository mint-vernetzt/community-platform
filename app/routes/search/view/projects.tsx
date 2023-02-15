import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient } from "~/auth.server";
import { H3, H4 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getPublicURL } from "~/storage.server";
import { searchProjectsViaLike } from "../utils.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);

  const searchQueryForFTS = "'Unicode'"; // Mind the single quotes!
  const searchQueryForFTSMultiple = "'Kontakt' | 'zu' | 'Unternehmen'"; // Mind the single quotes!
  const searchQueryForLike = "Unicode";
  const searchQueryForLikeMultiple = ["a"];

  console.time("Overall time");

  // Prisma logging
  //prismaLog(); // <-- Restart dev server to use this

  // **************
  // 1. Prismas preview feature of Postgresql Full-Text Search
  // - Performance: ~15 ms for full profile on search query 'Kontakt zu Unternehmen'
  // - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-postgres-fts
  // - Fast implemented -> We have to write the where statement for each field on Profiles/Events, etc... -> see prismasFtsQuery()
  // - No substring search
  // - How to search on string arrays ? -> see profile.skills
  //const profiles = await prismasFtsQuery(searchQueryForFTS);
  //const profiles = await prismasFtsQuery(searchQueryForFTSMultiple);

  // **************
  // 2. prismas like filtering with where contains
  // - Performance: ~30 ms for full profile on search query 'Kontakt zu Unternehmen'
  // - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-like
  // - Fast implemented -> We have to write the where statement for each field on Profiles/Events, etc... -> see likeQueryMultiple()
  // - Simple substring search is possibe
  // - How to sort by relevance?
  // - Search on arrays is possible
  // - Search on relations is possible
  // - Case sensitive!
  const projects = await searchProjectsViaLike(searchQueryForLikeMultiple);

  // **************
  // 3. Build full text index inside schema with ts vector/ ts query

  // **************
  // 4. Own full text search field
  // TODO

  // **************
  // 5. Creating a postgres view
  //const profiles = await createPostgresView();

  //console.log(profiles);

  console.log("\n-------------------------------------------\n");
  console.timeEnd("Overall time");
  console.log("\n-------------------------------------------\n");

  const enhancedProjects = projects.map((project) => {
    let enhancedProject = project;
    if (enhancedProject.background !== null) {
      const publicURL = getPublicURL(authClient, enhancedProject.background);
      if (publicURL) {
        enhancedProject.background = getImageURL(publicURL, {
          resize: { type: "fit", width: 400, height: 280 },
        });
      }
    }
    if (enhancedProject.logo !== null) {
      const publicURL = getPublicURL(authClient, enhancedProject.logo);
      if (publicURL) {
        enhancedProject.logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 144, height: 144 },
        });
      }
    }
    enhancedProject.awards = enhancedProject.awards.map((relation) => {
      if (relation.award.logo !== null) {
        const publicURL = getPublicURL(authClient, relation.award.logo);
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

  // TODO:
  // - Get pagination values (skip, take) from searchParams -> Do we want pagination with the latency?
  // - Get the query from searchParams
  // - Who has access?

  return json(
    {
      projects: enhancedProjects,
    },
    { headers: response.headers }
  );
};

export default function Projects() {
  const loaderData = useLoaderData<typeof loader>();

  // TODO: Pagination -> Do we want pagination with the latency?

  // const { items, refCallback } = useInfiniteItems(
  //   loaderData.projects,
  //   "/explore/projects",
  //   "projects"
  // );

  return (
    <>
      {loaderData.projects.length > 0 ? (
        <section
          // ref={refCallback} // TODO: Pagination -> Do we want pagination with the latency?
          className="container my-8 md:my-10 lg:my-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 items-stretch"
        >
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
                    <img
                      src={
                        project.background ||
                        "/images/default-event-background.jpg"
                      }
                      alt={project.name}
                      className="object-cover w-full h-full"
                    />
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
                        project.responsibleOrganizations.length > 0 ? (
                          <p className="font-bold text-sm">
                            {project.responsibleOrganizations
                              .map(({ organization }) => organization.name)
                              .join(" / ")}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {project.excerpt !== null && project.excerpt !== "" ? (
                      <div className="mt-2 line-clamp-3 text-sm">
                        {project.excerpt}
                      </div>
                    ) : null}
                  </div>
                  {project.awards.length > 0 ? (
                    <div className="-mt-4 flex ml-4">
                      {project.awards.map(({ award }) => {
                        const date = utcToZonedTime(
                          award.date,
                          "Europe/Berlin"
                        );
                        return (
                          <div
                            key={`award-${award.id}`}
                            className="bg-[url('/images/award_bg.svg')] -mt-px bg-cover bg-no-repeat bg-left-top drop-shadow-lg aspect-[11/17]"
                          >
                            <div className="flex flex-col items-center justify-center min-w-[57px] min-h-[88px] h-full pt-2">
                              <div className="h-8 w-8 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                                {award.logo !== null && award.logo !== "" ? (
                                  <img src={award.logo} alt={award.title} />
                                ) : (
                                  getInitialsOfName(award.title)
                                )}
                              </div>
                              <div className="px-2 pt-1 mb-4">
                                {award.shortTitle ? (
                                  <H4
                                    like="h4"
                                    className="text-xxs mb-0 text-center text-neutral-600 font-bold leading-none"
                                  >
                                    {award.shortTitle}
                                  </H4>
                                ) : null}
                                <p className="text-xxs text-center leading-none">
                                  {date.getFullYear()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
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
      ) : (
        <p className="text-center">
          Für Deine Suche konnten leider keine Projekte gefunden werden.
        </p>
      )}
    </>
  );
}
