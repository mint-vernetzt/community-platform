import type { LoaderFunctionArgs } from "react-router";
import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import {
  filterOrganizationByVisibility,
  filterProjectByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import {
  countSearchedProjects,
  getQueryValueAsArrayOfWords,
  getTakeParam,
  searchProjectsViaLike,
} from "./utils.server";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { ProjectCard } from "@mint-vernetzt/components/src/organisms/cards/ProjectCard";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["search/projects"];

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { take, page, itemsPerPage } = getTakeParam(request);

  const sessionUser = await getSessionUser(authClient);

  let projectsCount: Awaited<ReturnType<typeof countSearchedProjects>>;
  let rawProjects: Awaited<ReturnType<typeof searchProjectsViaLike>>;
  if (searchQuery.length === 0) {
    projectsCount = 0;
    rawProjects = [];
  } else {
    const projectsCountQuery = countSearchedProjects({
      searchQuery,
      sessionUser,
      language,
    });
    const rawProjectsQuery = searchProjectsViaLike({
      searchQuery,
      sessionUser,
      take,
      language,
    });
    const [projectsCountResult, rawProjectsResult] =
      await prismaClient.$transaction([projectsCountQuery, rawProjectsQuery]);
    projectsCount = projectsCountResult;
    rawProjects = rawProjectsResult;
  }

  const enhancedProjects = [];

  for (const project of rawProjects) {
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
          type Organization = typeof relation.organization;
          const filteredOrganization =
            filterOrganizationByVisibility<Organization>(relation.organization);
          return { ...relation, organization: filteredOrganization };
        });
    }

    // Add images from image proxy
    let background = enhancedProject.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Project.Card.Background },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Project.Card.BlurredBackground,
          },
          blur: BlurFactor,
        });
      }
    }

    let logo = enhancedProject.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL) {
        logo = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Project.Card.Logo },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Project.Card.BlurredLogo },
          blur: BlurFactor,
        });
      }
    }

    const responsibleOrganizations =
      enhancedProject.responsibleOrganizations.map((relation) => {
        let logo = relation.organization.logo;
        let blurredLogo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL) {
            logo = getImageURL(publicURL, {
              resize: {
                type: "fill",
                ...ImageSizes.Organization.CardFooter.Logo,
              },
            });
            blurredLogo = getImageURL(publicURL, {
              resize: {
                type: "fill",
                ...ImageSizes.Organization.CardFooter.BlurredLogo,
              },
              blur: BlurFactor,
            });
          }
        }
        return {
          ...relation,
          organization: { ...relation.organization, logo, blurredLogo },
        };
      });

    const imageEnhancedProject = {
      ...enhancedProject,
      background,
      blurredBackground,
      logo,
      blurredLogo,
      responsibleOrganizations,
    };

    enhancedProjects.push(imageEnhancedProject);
  }

  return {
    projects: enhancedProjects,
    count: projectsCount,
    pagination: { page, itemsPerPage },
    locales,
  };
};

export default function SearchView() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const [searchParams] = useSearchParams();

  const navigation = useNavigation();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${loaderData.pagination.page + 1}`);

  return (
    <>
      {loaderData.projects.length > 0 ? (
        <>
          <section className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
            <CardContainer type="multi row">
              {loaderData.projects.map((project) => {
                return (
                  <ProjectCard
                    key={`project-${project.id}`}
                    project={project}
                    locales={locales}
                  />
                );
              })}
            </CardContainer>
          </section>
          {loaderData.count > loaderData.projects.length && (
            <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 @md:mv-mb-24 @lg:mv-mb-8 mv-mt-4 @lg:mv-mt-8">
              <Link
                to={`?${loadMoreSearchParams.toString()}`}
                preventScrollReset
                replace
              >
                <Button
                  size="large"
                  variant="outline"
                  loading={navigation.state === "loading"}
                  disabled={navigation.state === "loading"}
                >
                  {locales.route.more}
                </Button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-primary">{locales.route.empty}</p>
      )}
    </>
  );
}
