import type { LinksFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1, H3, H4 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import {
  filterOrganizationByVisibility,
  filterProjectByVisibility,
} from "~/public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { getAllProjects, getPaginationValues } from "./utils.server";
import React from "react";
import { Button } from "@mint-vernetzt/components";
// import styles from "../../../common/design/styles/styles.css";

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();

  const { skip, take, page, itemsPerPage } = getPaginationValues(request, {
    itemsPerPage: 6,
  });

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);
  const projects = await getAllProjects(skip, take);

  const enhancedProjects = [];

  for (const project of projects) {
    let enhancedProject = {
      ...project,
    };

    if (sessionUser === null) {
      // Filter project
      enhancedProject = await filterProjectByVisibility<typeof enhancedProject>(
        enhancedProject
      );
      // Filter responsible organizations of project
      enhancedProject.responsibleOrganizations = await Promise.all(
        enhancedProject.responsibleOrganizations.map(async (relation) => {
          const filteredOrganization = await filterOrganizationByVisibility<
            typeof relation.organization
          >(relation.organization);
          return { ...relation, organization: filteredOrganization };
        })
      );
    }

    // Add images from image proxy
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
      let logo = relation.award.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return { ...relation, award: { ...relation.award, logo } };
    });

    enhancedProjects.push(enhancedProject);
  }

  return json(
    {
      projects: enhancedProjects,
      pagination: {
        page,
        itemsPerPage,
      },
    },
    { headers: response.headers }
  );
};

function Projects() {
  const loaderData = useLoaderData<typeof loader>();

  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const [items, setItems] = React.useState(loaderData.projects);
  const [shouldFetch, setShouldFetch] = React.useState(() => {
    if (loaderData.projects.length < loaderData.pagination.itemsPerPage) {
      return false;
    }
    return true;
  });
  const [page, setPage] = React.useState(() => {
    const pageParam = searchParams.get("page");
    if (pageParam !== null) {
      return parseInt(pageParam);
    }
    return 1;
  });

  React.useEffect(() => {
    if (fetcher.data !== undefined && fetcher.data.projects !== undefined) {
      setItems((items) => [...items, ...fetcher.data.projects]);
      setPage(fetcher.data.pagination.page);
      if (fetcher.data.projects.length < fetcher.data.pagination.itemsPerPage) {
        setShouldFetch(false);
      }
    }
  }, [fetcher.data]);

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
        {items.map((project) => {
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
                      {project.responsibleOrganizations.length > 0 ? (
                        <p className="font-bold text-sm">
                          {project.responsibleOrganizations
                            .map((relation) => relation.organization.name)
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
                    {project.awards.map((relation) => {
                      const date = utcToZonedTime(
                        relation.award.date,
                        "Europe/Berlin"
                      );
                      return (
                        <div
                          key={`award-${relation.award.id}`}
                          className="bg-[url('/images/award_bg.svg')] -mt-px bg-cover bg-no-repeat bg-left-top drop-shadow-lg aspect-[11/17]"
                        >
                          <div className="flex flex-col items-center justify-center min-w-[57px] min-h-[88px] h-full pt-2">
                            <div className="h-8 w-8 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
                              {relation.award.logo !== "" ? (
                                <img
                                  src={relation.award.logo}
                                  alt={relation.award.title}
                                />
                              ) : (
                                getInitialsOfName(relation.award.title)
                              )}
                            </div>
                            <div className="px-2 pt-1 mb-4">
                              {relation.award.shortTitle ? (
                                <H4
                                  like="h4"
                                  className="text-xxs mb-0 text-center text-neutral-600 font-bold leading-none"
                                >
                                  {relation.award.shortTitle}
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
      {shouldFetch && (
        <div className="w-full flex justify-center">
          <fetcher.Form method="get">
            <input key="page" type="hidden" name="page" value={page + 1} />
            <button
              type="submit"
              className={`btn btn-sm font-semibold h-12 text-base px-6 py-2.5 border-2 bg-neutral-50 border-primary text-primary hover:bg-primary-100 hover:border-primary focus:bg-primary-100 focus:border-primary active:bg-primary-100 active:border-primary ${
                fetcher.state === "submitting" ? "loading" : undefined
              }`.trim()}
              size="large"
              variant="outline"
              loading={fetcher.state === "submitting"}
            >
              Weitere laden
            </button>
          </fetcher.Form>
        </div>
      )}
    </>
  );
}

export default Projects;
