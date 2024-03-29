import { Button, CardContainer, ProjectCard } from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useFetcher,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import React from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { GravityType, getImageURL } from "~/images.server";
import {
  filterOrganizationByVisibility,
  filterProjectByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import {
  getAllProjects,
  getPaginationValues,
  getSortValue,
} from "./utils.server";
import { useTranslation } from "react-i18next";
import { getFeatureAbilities } from "~/lib/utils/application";
// import styles from "../../../common/design/styles/styles.css";

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

const i18nNS = ["routes/explore/projects"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { skip, take, page, itemsPerPage } = getPaginationValues(request, {
    itemsPerPage: 8,
  });
  const { sortBy } = getSortValue(request);

  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["filter"]);

  if (abilities.filter.hasAccess) {
    return redirect("/next/explore/projects");
  }

  const sessionUser = await getSessionUser(authClient);
  const projects = await getAllProjects({ skip, take, sortBy });

  const enhancedProjects = [];

  for (const project of projects) {
    let enhancedProject = {
      ...project,
    };

    if (sessionUser === null) {
      // Filter project
      type EnhancedProject = typeof enhancedProject;
      enhancedProject =
        filterProjectByVisibility<EnhancedProject>(enhancedProject);
      // Filter responsible organizations of project
      enhancedProject.responsibleOrganizations =
        enhancedProject.responsibleOrganizations.map((relation) => {
          type OrganizationRelation = typeof relation.organization;
          const filteredOrganization =
            filterOrganizationByVisibility<OrganizationRelation>(
              relation.organization
            );

          return { ...relation, organization: filteredOrganization };
        });
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

    enhancedProject.responsibleOrganizations =
      enhancedProject.responsibleOrganizations.map((relation) => {
        let logo = relation.organization.logo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL) {
            logo = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        return {
          ...relation,
          organization: { ...relation.organization, logo },
        };
      });

    enhancedProjects.push(enhancedProject);
  }

  return json({
    projects: enhancedProjects,
    pagination: {
      page,
      itemsPerPage,
    },
  });
};

function Projects() {
  const loaderData = useLoaderData<typeof loader>();

  const fetcher = useFetcher<typeof loader>();
  const [searchParams] = useSearchParams();
  const sortBy = searchParams.get("sortBy");
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
    if (fetcher.data !== undefined) {
      setItems((projects) => {
        return fetcher.data !== undefined
          ? [...projects, ...fetcher.data.projects]
          : [...projects];
      });
      setPage(fetcher.data.pagination.page);
      if (fetcher.data.projects.length < fetcher.data.pagination.itemsPerPage) {
        setShouldFetch(false);
      }
    }
  }, [fetcher.data]);

  React.useEffect(() => {
    setItems(loaderData.projects);

    if (loaderData.projects.length < loaderData.pagination.itemsPerPage) {
      setShouldFetch(false);
    } else {
      setShouldFetch(true);
    }
    setPage(1);
  }, [loaderData.projects, loaderData.pagination.itemsPerPage]);

  const submit = useSubmit();
  function handleChange(event: React.FormEvent<HTMLFormElement>) {
    submit(event.currentTarget);
  }

  const { t } = useTranslation(i18nNS);

  return (
    <>
      <section className="container my-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">{t("title")}</H1>
        <p className="">{t("intro")}</p>
      </section>

      <section className="container mb-8">
        <Form method="get" onChange={handleChange}>
          <input hidden name="page" value={1} readOnly />
          <div className="flex flex-wrap -mx-4">
            <div className="form-control px-4 pb-4 flex-initial w-full md:w-1/4">
              <label className="block font-semibold mb-2">
                {t("filter.sort.label")}
              </label>
              <select
                id="sortBy"
                name="sortBy"
                defaultValue={sortBy || "nameAsc"}
                className="select w-full select-bordered"
              >
                <option key="nameAsc" value="nameAsc">
                  {t("filter.sortBy.name-asc")}
                </option>
                <option key="nameDesc" value="nameDesc">
                  {t("filter.sortBy.name-desc")}
                </option>
                <option key="newest" value="newest">
                  {t("filter.sortBy.createdAt-desc")}
                </option>
              </select>
            </div>
          </div>
          <div className="flex justify-end items-end">
            <noscript>
              <button
                id="noScriptSubmitButton"
                type="submit"
                className="btn btn-primary mr-2"
              >
                Sortierung anwenden
              </button>
            </noscript>
          </div>
        </Form>
      </section>

      <section className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        <CardContainer type="multi row">
          {items.map((project) => {
            return (
              <ProjectCard key={`project-${project.id}`} project={project} />
            );
          })}
        </CardContainer>
      </section>
      {shouldFetch && (
        <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 md:mv-mb-24 lg:mv-mb-8 mv-mt-4 lg:mv-mt-8">
          <fetcher.Form method="get">
            <input
              key="sortBy"
              type="hidden"
              name="sortBy"
              value={sortBy || "nameAsc"}
            />
            <input key="page" type="hidden" name="page" value={page + 1} />
            <Button
              size="large"
              variant="outline"
              loading={fetcher.state === "loading"}
            >
              {t("more")}
            </Button>
          </fetcher.Form>
        </div>
      )}
    </>
  );
}

export default Projects;
