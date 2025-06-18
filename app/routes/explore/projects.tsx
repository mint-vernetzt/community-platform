import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { ProjectCard } from "@mint-vernetzt/components/src/organisms/cards/ProjectCard";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import type { LoaderFunctionArgs } from "react-router";
import {
  Form,
  redirect,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { ConformForm } from "~/components-next/ConformForm";
import { Dropdown } from "~/components-next/Dropdown";
import { Filters, ShowFiltersButton } from "~/components-next/Filters";
import { FormControl } from "~/components-next/FormControl";
import {
  HiddenFilterInputs,
  HiddenFilterInputsInContext,
} from "~/components-next/HiddenFilterInputs";
import { detectLanguage } from "~/i18n.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { languageModuleMap } from "~/locales/.server";
import {
  filterOrganizationByVisibility,
  filterProjectByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { getFilterSchemes, type FilterSchemes } from "./all.shared";
import {
  getAllAdditionalDisciplines,
  getAllDisciplines,
  getAllFinancings,
  getAllFormats,
  getAllProjects,
  getAllProjectTargetGroups,
  getAllSpecialTargetGroups,
  getFilterCountForSlug,
  getProjectFilterVectorForAttribute,
  getProjectIds,
  getTakeParam,
} from "./projects.server";
import { PROJECT_SORT_VALUES } from "./projects.shared";
import { getAreaNameBySlug, getAreasBySearchQuery } from "./utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const showFiltersValue = searchParams.getAll("showFilters");

  if (showFiltersValue.length > 1) {
    const cleanURL = new URL(request.url);
    cleanURL.searchParams.delete("showFilters");
    cleanURL.searchParams.append("showFilters", "on");
    return redirect(cleanURL.toString(), { status: 301 });
  }

  const submission = parseWithZod(searchParams, {
    schema: getFilterSchemes,
  });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["explore/projects"];

  const take = getTakeParam(submission.value.prjPage);
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let filteredByVisibilityCount;
  if (!isLoggedIn) {
    const projectIdsFilteredByVisibility = await getProjectIds({
      filter: submission.value.prjFilter,
      search: submission.value.search,
      isLoggedIn,
      language,
    });
    filteredByVisibilityCount = await projectIdsFilteredByVisibility.length;
  }

  const projectIds = await getProjectIds({
    filter: submission.value.prjFilter,
    search: submission.value.search,
    isLoggedIn: true,
    language,
  });

  const projectCount = projectIds.length;

  const projects = await getAllProjects({
    filter: submission.value.prjFilter,
    sortBy: submission.value.prjSortBy,
    search: submission.value.search,
    sessionUser,
    take,
    language,
  });

  const enhancedProjects = [];
  for (const project of projects) {
    let enhancedProject = {
      ...project,
    };

    if (!isLoggedIn) {
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
    let background = enhancedProject.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Project.Card.Background.width,
            height: ImageSizes.Project.Card.Background.height,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Project.Card.BlurredBackground.width,
            height: ImageSizes.Project.Card.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Project.Background;
      blurredBackground = DefaultImages.Project.BlurredBackground;
    }

    let logo = enhancedProject.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Project.Card.Logo.width,
            height: ImageSizes.Project.Card.Logo.height,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Project.Card.BlurredLogo.width,
            height: ImageSizes.Project.Card.BlurredLogo.height,
          },
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
                width: ImageSizes.Organization.CardFooter.Logo.width,
                height: ImageSizes.Organization.CardFooter.Logo.height,
              },
            });
            blurredLogo = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Organization.CardFooter.BlurredLogo.width,
                height: ImageSizes.Organization.CardFooter.BlurredLogo.height,
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

  const areas = await getAreasBySearchQuery(submission.value.prjAreaSearch);
  type EnhancedAreas = Array<
    ArrayElement<Awaited<ReturnType<typeof getAreasBySearchQuery>>> & {
      vectorCount: ReturnType<typeof getFilterCountForSlug>;
    }
  >;
  const enhancedAreas = {
    global: [] as EnhancedAreas,
    country: [] as EnhancedAreas,
    state: [] as EnhancedAreas,
    district: [] as EnhancedAreas,
  };
  const areaProjectIds =
    submission.value.search.length > 0
      ? await getProjectIds({
          filter: { ...submission.value.prjFilter, area: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : projectIds;
  const areaFilterVector = await getProjectFilterVectorForAttribute({
    attribute: "area",
    filter: submission.value.prjFilter,
    search: submission.value.search,
    ids: areaProjectIds,
  });
  for (const area of areas) {
    const vectorCount = getFilterCountForSlug(
      area.slug,
      areaFilterVector,
      "area"
    );
    const enhancedArea = {
      ...area,
      vectorCount,
    };
    enhancedAreas[area.type].push(enhancedArea);
  }
  const selectedAreas = await Promise.all(
    submission.value.prjFilter.area.map(async (slug) => {
      const vectorCount = getFilterCountForSlug(slug, areaFilterVector, "area");
      const isInSearchResultsList = areas.some((area) => {
        return area.slug === slug;
      });
      return {
        slug,
        name: (await getAreaNameBySlug(slug)) || null,
        vectorCount,
        isInSearchResultsList,
      };
    })
  );

  const disciplines = await getAllDisciplines();
  const disciplineProjectIds =
    submission.value.search.length > 0
      ? await getProjectIds({
          filter: { ...submission.value.prjFilter, discipline: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : projectIds;
  const disciplineFilterVector = await getProjectFilterVectorForAttribute({
    attribute: "discipline",
    filter: submission.value.prjFilter,
    search: submission.value.search,
    ids: disciplineProjectIds,
  });
  const enhancedDisciplines = disciplines.map((discipline) => {
    const vectorCount = getFilterCountForSlug(
      discipline.slug,
      disciplineFilterVector,
      "discipline"
    );
    return { ...discipline, vectorCount };
  });

  const additionalDisciplines = await getAllAdditionalDisciplines();
  const additionalDisciplineProjectIds =
    submission.value.search.length > 0
      ? await getProjectIds({
          filter: { ...submission.value.prjFilter, additionalDiscipline: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : projectIds;
  const additionalDisciplineFilterVector =
    await getProjectFilterVectorForAttribute({
      attribute: "additionalDiscipline",
      filter: submission.value.prjFilter,
      search: submission.value.search,
      ids: additionalDisciplineProjectIds,
    });
  const enhancedAdditionalDisciplines = additionalDisciplines.map(
    (additionalDiscipline) => {
      const vectorCount = getFilterCountForSlug(
        additionalDiscipline.slug,
        additionalDisciplineFilterVector,
        "additionalDiscipline"
      );
      return { ...additionalDiscipline, vectorCount };
    }
  );

  const targetGroups = await getAllProjectTargetGroups();
  const targetGroupProjectIds =
    submission.value.search.length > 0
      ? await getProjectIds({
          filter: { ...submission.value.prjFilter, projectTargetGroup: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : projectIds;
  const targetGroupFilterVector = await getProjectFilterVectorForAttribute({
    attribute: "projectTargetGroup",
    filter: submission.value.prjFilter,
    search: submission.value.search,
    ids: targetGroupProjectIds,
  });
  const enhancedTargetGroups = targetGroups.map((targetGroup) => {
    const vectorCount = getFilterCountForSlug(
      targetGroup.slug,
      targetGroupFilterVector,
      "projectTargetGroup"
    );
    return { ...targetGroup, vectorCount };
  });

  const formats = await getAllFormats();
  const formatProjectIds =
    submission.value.search.length > 0
      ? await getProjectIds({
          filter: { ...submission.value.prjFilter, format: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : projectIds;
  const formatFilterVector = await getProjectFilterVectorForAttribute({
    attribute: "format",
    filter: submission.value.prjFilter,
    search: submission.value.search,
    ids: formatProjectIds,
  });
  const enhancedFormats = formats.map((format) => {
    const vectorCount = getFilterCountForSlug(
      format.slug,
      formatFilterVector,
      "format"
    );
    return { ...format, vectorCount };
  });

  const specialTargetGroups = await getAllSpecialTargetGroups();
  const specialTargetGroupProjectIds =
    submission.value.search.length > 0
      ? await getProjectIds({
          filter: { ...submission.value.prjFilter, specialTargetGroup: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : projectIds;
  const specialTargetGroupFilterVector =
    await getProjectFilterVectorForAttribute({
      attribute: "specialTargetGroup",
      filter: submission.value.prjFilter,
      search: submission.value.search,
      ids: specialTargetGroupProjectIds,
    });
  const enhancedSpecialTargetGroups = specialTargetGroups.map(
    (specialTargetGroup) => {
      const vectorCount = getFilterCountForSlug(
        specialTargetGroup.slug,
        specialTargetGroupFilterVector,
        "specialTargetGroup"
      );
      return { ...specialTargetGroup, vectorCount };
    }
  );

  const financings = await getAllFinancings();
  const financingProjectIds =
    submission.value.search.length > 0
      ? await getProjectIds({
          filter: { ...submission.value.prjFilter, financing: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : projectIds;
  const financingFilterVector = await getProjectFilterVectorForAttribute({
    attribute: "financing",
    filter: submission.value.prjFilter,
    search: submission.value.search,
    ids: financingProjectIds,
  });
  const enhancedFinancings = financings.map((financing) => {
    const vectorCount = getFilterCountForSlug(
      financing.slug,
      financingFilterVector,
      "financing"
    );
    return { ...financing, vectorCount };
  });

  return {
    projects: enhancedProjects,
    disciplines: enhancedDisciplines,
    selectedDisciplines: submission.value.prjFilter.discipline,
    additionalDisciplines: enhancedAdditionalDisciplines,
    selectedAdditionalDisciplines:
      submission.value.prjFilter.additionalDiscipline,
    targetGroups: enhancedTargetGroups,
    selectedTargetGroups: submission.value.prjFilter.projectTargetGroup,
    areas: enhancedAreas,
    selectedAreas,
    formats: enhancedFormats,
    selectedFormats: submission.value.prjFilter.format,
    specialTargetGroups: enhancedSpecialTargetGroups,
    selectedSpecialTargetGroups: submission.value.prjFilter.specialTargetGroup,
    financings: enhancedFinancings,
    selectedFinancings: submission.value.prjFilter.financing,
    submission,
    filteredByVisibilityCount,
    projectsCount: projectCount,
    locales,
  };
};

export default function ExploreProjects() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isHydrated = useHydrated();

  const [form, fields] = useForm<FilterSchemes>({
    id: "filter-projects",
    defaultValue: {
      ...loaderData.submission.value,
      showFilters: "on",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const prjFilterFieldset = fields.prjFilter.getFieldset();

  const [loadMoreForm, loadMoreFields] = useForm<FilterSchemes>({
    id: "load-more-projects",
    defaultValue: {
      ...loaderData.submission.value,
      prjPage: loaderData.submission.value.prjPage + 1,
      showFilters: "",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const [resetForm, resetFields] = useForm<FilterSchemes>({
    id: "reset-projects-filters",
    defaultValue: {
      ...loaderData.submission.value,
      prjFilter: {
        additionalDiscipline: [],
        discipline: [],
        area: [],
        projectTargetGroup: [],
        specialTargetGroup: [],
        format: [],
        financing: [],
      },
      prjPage: 1,
      prjSortBy: PROJECT_SORT_VALUES[0],
      prjAreaSearch: "",
      showFilters: "",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const currentSortValue = PROJECT_SORT_VALUES.find((value) => {
    return value === `${loaderData.submission.value.prjSortBy}`;
  });

  let showMore = false;
  if (typeof loaderData.filteredByVisibilityCount !== "undefined") {
    showMore =
      loaderData.filteredByVisibilityCount > loaderData.projects.length;
  } else {
    showMore = loaderData.projectsCount > loaderData.projects.length;
  }

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
        <Form
          {...getFormProps(form)}
          method="get"
          onChange={(event) => {
            let preventScrollReset = true;
            if (
              (event.target as HTMLFormElement).name === fields.showFilters.name
            ) {
              preventScrollReset = false;
            }
            submit(event.currentTarget, { preventScrollReset, method: "get" });
          }}
        >
          <HiddenFilterInputs
            fields={fields}
            defaultValue={loaderData.submission.value}
            entityLeftOut="project"
          />

          {/* Project Filters */}
          <input {...getInputProps(fields.prjPage, { type: "hidden" })} />
          <ShowFiltersButton>
            {locales.route.filter.showFiltersLabel}
          </ShowFiltersButton>
          <Filters
            showFilters={searchParams.get(fields.showFilters.name) === "on"}
          >
            <Filters.Title>{locales.route.filter.title}</Filters.Title>
            <Filters.Fieldset
              className="mv-flex mv-flex-wrap @lg:mv-gap-4"
              {...getFieldsetProps(fields.prjFilter)}
              showMore={locales.route.filter.showMore}
              showLess={locales.route.filter.showLess}
            >
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.disciplines}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedDisciplines
                      .map((discipline) => {
                        let title;
                        if (discipline in locales.disciplines) {
                          type LocaleKey = keyof typeof locales.disciplines;
                          title =
                            locales.disciplines[discipline as LocaleKey].title;
                        } else {
                          console.error(
                            `Discipline ${discipline} not found in locales`
                          );
                          title = discipline;
                        }
                        return title;
                      })
                      .concat(
                        loaderData.selectedAdditionalDisciplines.map(
                          (additionalDiscipline) => {
                            let title;
                            if (
                              additionalDiscipline in
                              locales.additionalDisciplines
                            ) {
                              type LocaleKey =
                                keyof typeof locales.additionalDisciplines;
                              title =
                                locales.additionalDisciplines[
                                  additionalDiscipline as LocaleKey
                                ].title;
                            } else {
                              console.error(
                                `Additional discipline ${additionalDiscipline} not found in locales`
                              );
                              title = additionalDiscipline;
                            }
                            return title;
                          }
                        )
                      )
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.disciplines.map((discipline) => {
                    const isChecked =
                      prjFilterFieldset.discipline.initialValue &&
                      Array.isArray(prjFilterFieldset.discipline.initialValue)
                        ? prjFilterFieldset.discipline.initialValue.includes(
                            discipline.slug
                          )
                        : prjFilterFieldset.discipline.initialValue ===
                          discipline.slug;
                    return (
                      <FormControl
                        {...getInputProps(prjFilterFieldset.discipline, {
                          type: "checkbox",
                          value: discipline.slug,
                        })}
                        key={discipline.slug}
                        defaultChecked={isChecked}
                        disabled={discipline.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>
                          {(() => {
                            let title;
                            if (discipline.slug in locales.disciplines) {
                              type LocaleKey = keyof typeof locales.disciplines;
                              title =
                                locales.disciplines[
                                  discipline.slug as LocaleKey
                                ].title;
                            } else {
                              console.error(
                                `Discipline ${discipline.slug} not found in locales`
                              );
                              title = discipline.slug;
                            }
                            return title;
                          })()}
                        </FormControl.Label>
                        {(() => {
                          let description;
                          if (discipline.slug in locales.disciplines) {
                            type LocaleKey = keyof typeof locales.disciplines;
                            description =
                              locales.disciplines[discipline.slug as LocaleKey]
                                .description;
                          } else {
                            console.error(
                              `Discipline ${discipline.slug} not found in locales`
                            );
                            description = null;
                          }
                          return description !== null ? (
                            <FormControl.Info id={discipline.slug}>
                              {description}
                            </FormControl.Info>
                          ) : null;
                        })()}
                        <FormControl.Counter>
                          {discipline.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                  <Dropdown.Divider />
                  <Dropdown.Category>
                    {locales.route.filter.additionalDisciplines}
                  </Dropdown.Category>
                  {loaderData.additionalDisciplines.map(
                    (additionalDiscipline) => {
                      const isChecked =
                        prjFilterFieldset.additionalDiscipline.initialValue &&
                        Array.isArray(
                          prjFilterFieldset.additionalDiscipline.initialValue
                        )
                          ? prjFilterFieldset.additionalDiscipline.initialValue.includes(
                              additionalDiscipline.slug
                            )
                          : prjFilterFieldset.additionalDiscipline
                              .initialValue === additionalDiscipline.slug;
                      return (
                        <FormControl
                          {...getInputProps(
                            prjFilterFieldset.additionalDiscipline,
                            {
                              type: "checkbox",
                              value: additionalDiscipline.slug,
                            }
                          )}
                          key={additionalDiscipline.slug}
                          defaultChecked={isChecked}
                          disabled={
                            additionalDiscipline.vectorCount === 0 && !isChecked
                          }
                        >
                          <FormControl.Label>
                            {(() => {
                              let title;
                              if (
                                additionalDiscipline.slug in
                                locales.additionalDisciplines
                              ) {
                                type LocaleKey =
                                  keyof typeof locales.additionalDisciplines;
                                title =
                                  locales.additionalDisciplines[
                                    additionalDiscipline.slug as LocaleKey
                                  ].title;
                              } else {
                                console.error(
                                  `Additional discipline ${additionalDiscipline.slug} not found in locales`
                                );
                                title = additionalDiscipline.slug;
                              }
                              return title;
                            })()}
                          </FormControl.Label>
                          {(() => {
                            let description;
                            if (
                              additionalDiscipline.slug in
                              locales.additionalDisciplines
                            ) {
                              type LocaleKey =
                                keyof typeof locales.additionalDisciplines;
                              description =
                                locales.additionalDisciplines[
                                  additionalDiscipline.slug as LocaleKey
                                ].description;
                            } else {
                              console.error(
                                `Additional discipline ${additionalDiscipline.slug} not found in locales`
                              );
                              description = null;
                            }
                            return description !== null ? (
                              <FormControl.Info id={additionalDiscipline.slug}>
                                {description}
                              </FormControl.Info>
                            ) : null;
                          })()}
                          <FormControl.Counter>
                            {additionalDiscipline.vectorCount}
                          </FormControl.Counter>
                        </FormControl>
                      );
                    }
                  )}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.targetGroups}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedTargetGroups
                      .map((targetGroup) => {
                        let title;
                        if (targetGroup in locales.projectTargetGroups) {
                          type LocaleKey =
                            keyof typeof locales.projectTargetGroups;
                          title =
                            locales.projectTargetGroups[
                              targetGroup as LocaleKey
                            ].title;
                        } else {
                          console.error(
                            `Project target group ${targetGroup} not found in locales`
                          );
                          title = targetGroup;
                        }
                        return title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.targetGroups.map((targetGroup) => {
                    const isChecked =
                      prjFilterFieldset.projectTargetGroup.initialValue &&
                      Array.isArray(
                        prjFilterFieldset.projectTargetGroup.initialValue
                      )
                        ? prjFilterFieldset.projectTargetGroup.initialValue.includes(
                            targetGroup.slug
                          )
                        : prjFilterFieldset.projectTargetGroup.initialValue ===
                          targetGroup.slug;
                    return (
                      <FormControl
                        {...getInputProps(
                          prjFilterFieldset.projectTargetGroup,
                          {
                            type: "checkbox",
                            value: targetGroup.slug,
                          }
                        )}
                        key={targetGroup.slug}
                        defaultChecked={isChecked}
                        disabled={targetGroup.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>
                          {(() => {
                            let title;
                            if (
                              targetGroup.slug in locales.projectTargetGroups
                            ) {
                              type LocaleKey =
                                keyof typeof locales.projectTargetGroups;
                              title =
                                locales.projectTargetGroups[
                                  targetGroup.slug as LocaleKey
                                ].title;
                            } else {
                              console.error(
                                `Project target group ${targetGroup.slug} not found in locales`
                              );
                              title = targetGroup.slug;
                            }
                            return title;
                          })()}
                        </FormControl.Label>
                        {(() => {
                          let description;
                          if (targetGroup.slug in locales.projectTargetGroups) {
                            type LocaleKey =
                              keyof typeof locales.projectTargetGroups;
                            description =
                              locales.projectTargetGroups[
                                targetGroup.slug as LocaleKey
                              ].description;
                          } else {
                            console.error(
                              `Project target group ${targetGroup.slug} not found in locales`
                            );
                            description = null;
                          }
                          return description !== null ? (
                            <FormControl.Info id={targetGroup.slug}>
                              {description}
                            </FormControl.Info>
                          ) : null;
                        })()}
                        <FormControl.Counter>
                          {targetGroup.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.areas}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedAreas
                      .map((area) => {
                        return area.name;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.areas.global.map((area) => {
                    const isChecked =
                      prjFilterFieldset.area.initialValue &&
                      Array.isArray(prjFilterFieldset.area.initialValue)
                        ? prjFilterFieldset.area.initialValue.includes(
                            area.slug
                          )
                        : prjFilterFieldset.area.initialValue === area.slug;
                    return (
                      <FormControl
                        {...getInputProps(prjFilterFieldset.area, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        defaultChecked={isChecked}
                        disabled={area.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>{area.name}</FormControl.Label>
                        <FormControl.Counter>
                          {area.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                  {loaderData.areas.country.map((area) => {
                    const isChecked =
                      prjFilterFieldset.area.initialValue &&
                      Array.isArray(prjFilterFieldset.area.initialValue)
                        ? prjFilterFieldset.area.initialValue.includes(
                            area.slug
                          )
                        : prjFilterFieldset.area.initialValue === area.slug;
                    return (
                      <FormControl
                        {...getInputProps(prjFilterFieldset.area, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        defaultChecked={isChecked}
                        disabled={area.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>{area.name}</FormControl.Label>
                        <FormControl.Counter>
                          {area.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                  {loaderData.selectedAreas.length > 0 &&
                    loaderData.selectedAreas.map((selectedArea) => {
                      return selectedArea.name !== null &&
                        selectedArea.isInSearchResultsList === false ? (
                        <FormControl
                          {...getInputProps(prjFilterFieldset.area, {
                            type: "checkbox",
                            value: selectedArea.slug,
                          })}
                          key={selectedArea.slug}
                          defaultChecked={true}
                        >
                          <FormControl.Label>
                            {selectedArea.name}
                          </FormControl.Label>
                          <FormControl.Counter>
                            {selectedArea.vectorCount}
                          </FormControl.Counter>
                        </FormControl>
                      ) : null;
                    })}
                  <div className="mv-ml-4 mv-mr-2 mv-my-2">
                    <Input
                      {...getInputProps(fields.prjAreaSearch, {
                        type: "search",
                      })}
                      key="project-area-search"
                      placeholder={locales.route.filter.searchAreaPlaceholder}
                    >
                      <Input.Label htmlFor={fields.prjAreaSearch.id} hidden>
                        {locales.route.filter.searchAreaPlaceholder}
                      </Input.Label>
                      <Input.HelperText>
                        {locales.route.filter.searchAreaHelper}
                      </Input.HelperText>
                      <Input.Controls>
                        <noscript>
                          <Button>
                            {locales.route.filter.searchAreaButton}
                          </Button>
                        </noscript>
                      </Input.Controls>
                    </Input>
                  </div>
                  {loaderData.areas.state.length > 0 && (
                    <Dropdown.Legend>
                      {locales.route.filter.stateLabel}
                    </Dropdown.Legend>
                  )}
                  {loaderData.areas.state.length > 0 &&
                    loaderData.areas.state.map((area) => {
                      const isChecked =
                        prjFilterFieldset.area.initialValue &&
                        Array.isArray(prjFilterFieldset.area.initialValue)
                          ? prjFilterFieldset.area.initialValue.includes(
                              area.slug
                            )
                          : prjFilterFieldset.area.initialValue === area.slug;
                      return (
                        <FormControl
                          {...getInputProps(prjFilterFieldset.area, {
                            type: "checkbox",
                            value: area.slug,
                          })}
                          key={area.slug}
                          defaultChecked={isChecked}
                          disabled={area.vectorCount === 0 && !isChecked}
                        >
                          <FormControl.Label>{area.name}</FormControl.Label>
                          <FormControl.Counter>
                            {area.vectorCount}
                          </FormControl.Counter>
                        </FormControl>
                      );
                    })}
                  {loaderData.areas.state.length > 0 &&
                    loaderData.areas.district.length > 0 && (
                      <Dropdown.Divider />
                    )}
                  {loaderData.areas.district.length > 0 && (
                    <Dropdown.Legend>
                      {locales.route.filter.districtLabel}
                    </Dropdown.Legend>
                  )}
                  {loaderData.areas.district.length > 0 &&
                    loaderData.areas.district.map((area) => {
                      const isChecked =
                        prjFilterFieldset.area.initialValue &&
                        Array.isArray(prjFilterFieldset.area.initialValue)
                          ? prjFilterFieldset.area.initialValue.includes(
                              area.slug
                            )
                          : prjFilterFieldset.area.initialValue === area.slug;
                      return (
                        <FormControl
                          {...getInputProps(prjFilterFieldset.area, {
                            type: "checkbox",
                            value: area.slug,
                          })}
                          key={area.slug}
                          defaultChecked={isChecked}
                          disabled={area.vectorCount === 0 && !isChecked}
                        >
                          <FormControl.Label>{area.name}</FormControl.Label>
                          <FormControl.Counter>
                            {area.vectorCount}
                          </FormControl.Counter>
                        </FormControl>
                      );
                    })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.formats}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedFormats
                      .map((format) => {
                        let title;
                        if (format in locales.formats) {
                          type LocaleKey = keyof typeof locales.formats;
                          title = locales.formats[format as LocaleKey].title;
                        } else {
                          console.error(
                            `Format ${format} not found in locales`
                          );
                          title = format;
                        }
                        return title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.formats.map((format) => {
                    const isChecked =
                      prjFilterFieldset.format.initialValue &&
                      Array.isArray(prjFilterFieldset.format.initialValue)
                        ? prjFilterFieldset.format.initialValue.includes(
                            format.slug
                          )
                        : prjFilterFieldset.format.initialValue === format.slug;
                    return (
                      <FormControl
                        {...getInputProps(prjFilterFieldset.format, {
                          type: "checkbox",
                          value: format.slug,
                        })}
                        key={format.slug}
                        defaultChecked={isChecked}
                        disabled={format.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>
                          {(() => {
                            let title;
                            if (format.slug in locales.formats) {
                              type LocaleKey = keyof typeof locales.formats;
                              title =
                                locales.formats[format.slug as LocaleKey].title;
                            } else {
                              console.error(
                                `Format ${format.slug} not found in locales`
                              );
                              title = format.slug;
                            }
                            return title;
                          })()}
                        </FormControl.Label>
                        {(() => {
                          let description;
                          if (format.slug in locales.formats) {
                            type LocaleKey = keyof typeof locales.formats;
                            description =
                              locales.formats[format.slug as LocaleKey]
                                .description;
                          } else {
                            console.error(
                              `Format ${format.slug} not found in locales`
                            );
                            description = null;
                          }
                          return description !== null ? (
                            <FormControl.Info id={format.slug}>
                              {description}
                            </FormControl.Info>
                          ) : null;
                        })()}
                        <FormControl.Counter>
                          {format.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.specialTargetGroups}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedSpecialTargetGroups
                      .map((targetGroup) => {
                        let title;
                        if (targetGroup in locales.specialTargetGroups) {
                          type LocaleKey =
                            keyof typeof locales.specialTargetGroups;
                          title =
                            locales.specialTargetGroups[
                              targetGroup as LocaleKey
                            ].title;
                        } else {
                          console.error(
                            `Special target group ${targetGroup} not found in locales`
                          );
                          title = targetGroup;
                        }
                        return title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.specialTargetGroups.map((targetGroup) => {
                    const isChecked =
                      prjFilterFieldset.specialTargetGroup.initialValue &&
                      Array.isArray(
                        prjFilterFieldset.specialTargetGroup.initialValue
                      )
                        ? prjFilterFieldset.specialTargetGroup.initialValue.includes(
                            targetGroup.slug
                          )
                        : prjFilterFieldset.specialTargetGroup.initialValue ===
                          targetGroup.slug;
                    return (
                      <FormControl
                        {...getInputProps(
                          prjFilterFieldset.specialTargetGroup,
                          {
                            type: "checkbox",
                            value: targetGroup.slug,
                          }
                        )}
                        key={targetGroup.slug}
                        defaultChecked={isChecked}
                        disabled={targetGroup.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>
                          {(() => {
                            let title;
                            if (
                              targetGroup.slug in locales.specialTargetGroups
                            ) {
                              type LocaleKey =
                                keyof typeof locales.specialTargetGroups;
                              title =
                                locales.specialTargetGroups[
                                  targetGroup.slug as LocaleKey
                                ].title;
                            } else {
                              console.error(
                                `Special target group ${targetGroup.slug} not found in locales`
                              );
                              title = targetGroup.slug;
                            }
                            return title;
                          })()}
                        </FormControl.Label>
                        {(() => {
                          let description;
                          if (targetGroup.slug in locales.specialTargetGroups) {
                            type LocaleKey =
                              keyof typeof locales.specialTargetGroups;
                            description =
                              locales.specialTargetGroups[
                                targetGroup.slug as LocaleKey
                              ].description;
                          } else {
                            console.error(
                              `Special target group ${targetGroup.slug} not found in locales`
                            );
                            description = null;
                          }
                          return description !== null ? (
                            <FormControl.Info id={targetGroup.slug}>
                              {description}
                            </FormControl.Info>
                          ) : null;
                        })()}
                        <FormControl.Counter>
                          {targetGroup.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.financings}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedFinancings
                      .map((financing) => {
                        let title;
                        if (financing in locales.financings) {
                          type LocaleKey = keyof typeof locales.financings;
                          title =
                            locales.financings[financing as LocaleKey].title;
                        } else {
                          console.error(
                            `Financing ${financing} not found in locales`
                          );
                          title = financing;
                        }
                        return title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.financings.map((financing) => {
                    const isChecked =
                      prjFilterFieldset.financing.initialValue &&
                      Array.isArray(prjFilterFieldset.financing.initialValue)
                        ? prjFilterFieldset.financing.initialValue.includes(
                            financing.slug
                          )
                        : prjFilterFieldset.financing.initialValue ===
                          financing.slug;
                    return (
                      <FormControl
                        {...getInputProps(prjFilterFieldset.financing, {
                          type: "checkbox",
                          value: financing.slug,
                        })}
                        key={financing.slug}
                        defaultChecked={isChecked}
                        disabled={financing.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>
                          {(() => {
                            let title;
                            if (financing.slug in locales.financings) {
                              type LocaleKey = keyof typeof locales.financings;
                              title =
                                locales.financings[financing.slug as LocaleKey]
                                  .title;
                            } else {
                              console.error(
                                `Financings ${financing.slug} not found in locales`
                              );
                              title = financing.slug;
                            }
                            return title;
                          })()}
                        </FormControl.Label>
                        {(() => {
                          let description;
                          if (financing.slug in locales.financings) {
                            type LocaleKey = keyof typeof locales.financings;
                            description =
                              locales.financings[financing.slug as LocaleKey]
                                .description;
                          } else {
                            console.error(
                              `Financings ${financing.slug} not found in locales`
                            );
                            description = null;
                          }
                          return description !== null ? (
                            <FormControl.Info id={financing.slug}>
                              {description}
                            </FormControl.Info>
                          ) : null;
                        })()}
                        <FormControl.Counter>
                          {financing.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.Fieldset {...getFieldsetProps(fields.prjSortBy)}>
              <Dropdown orientation="right">
                <Dropdown.Label>
                  <span className="@lg:mv-hidden">
                    {locales.route.filter.sortBy.label}
                    <br />
                  </span>
                  <span className="mv-font-normal @lg:mv-font-semibold">
                    {
                      loaderData.locales.route.filter.sortBy.values[
                        currentSortValue || PROJECT_SORT_VALUES[0]
                      ]
                    }
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {PROJECT_SORT_VALUES.map((sortValue) => {
                    return (
                      <FormControl
                        {...getInputProps(fields.prjSortBy, {
                          type: "radio",
                          value: sortValue,
                        })}
                        key={sortValue}
                        defaultChecked={currentSortValue === sortValue}
                      >
                        <FormControl.Label>
                          {locales.route.filter.sortBy.values[sortValue]}
                        </FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.ResetButton form={resetForm.id}>
              {isHydrated
                ? locales.route.filter.reset
                : locales.route.filter.close}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {isHydrated
                ? decideBetweenSingularOrPlural(
                    insertParametersIntoLocale(
                      locales.route.showNumberOfItems_one,
                      {
                        count: loaderData.projectsCount,
                      }
                    ),
                    insertParametersIntoLocale(
                      locales.route.showNumberOfItems_other,
                      {
                        count: loaderData.projectsCount,
                      }
                    ),
                    loaderData.projectsCount
                  )
                : locales.route.filter.apply}
            </Filters.ApplyButton>
          </Filters>
          <noscript className="mv-hidden @lg:mv-block mv-mt-2">
            <Button>{locales.route.filter.apply}</Button>
          </noscript>
        </Form>
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
        <hr className="mv-border-t mv-border-gray-200 mv-mt-4" />
      </div>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6">
        {(loaderData.selectedDisciplines.length > 0 ||
          loaderData.selectedAdditionalDisciplines.length > 0 ||
          loaderData.selectedTargetGroups.length > 0 ||
          loaderData.selectedAreas.length > 0 ||
          loaderData.selectedFormats.length > 0 ||
          loaderData.selectedSpecialTargetGroups.length > 0 ||
          loaderData.selectedFinancings.length > 0) && (
          <div className="mv-flex mv-flex-col mv-gap-2">
            <div className="mv-overflow-auto mv-flex mv-flex-nowrap @lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-2">
              {loaderData.selectedDisciplines.map((selectedDiscipline) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  prjFilterFieldset.discipline.name,
                  selectedDiscipline
                );
                let title;
                if (selectedDiscipline in locales.disciplines) {
                  type LocaleKey = keyof typeof locales.disciplines;
                  title =
                    locales.disciplines[selectedDiscipline as LocaleKey].title;
                } else {
                  console.error(
                    `Discipline ${selectedDiscipline} not found in locales`
                  );
                  title = selectedDiscipline;
                }
                return (
                  <ConformForm
                    key={selectedDiscipline}
                    useFormOptions={{
                      id: `delete-filter-${selectedDiscipline}`,
                      defaultValue: {
                        ...loaderData.submission.value,
                        prjFilter: {
                          ...loaderData.submission.value.prjFilter,
                          discipline:
                            loaderData.submission.value.prjFilter.discipline.filter(
                              (discipline) => discipline !== selectedDiscipline
                            ),
                        },
                        showFilters: "",
                      },
                      constraint: getZodConstraint(getFilterSchemes),
                      lastResult:
                        navigation.state === "idle"
                          ? loaderData.submission
                          : null,
                    }}
                    formProps={{
                      method: "get",
                      preventScrollReset: true,
                    }}
                  >
                    <HiddenFilterInputsInContext />
                    <Chip size="medium">
                      {title}
                      <Chip.Delete>
                        <button
                          type="submit"
                          disabled={navigation.state === "loading"}
                        >
                          X
                        </button>
                      </Chip.Delete>
                    </Chip>
                  </ConformForm>
                );
              })}
              {loaderData.selectedAdditionalDisciplines.map(
                (selectedAdditionalDiscipline) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(
                    prjFilterFieldset.additionalDiscipline.name,
                    selectedAdditionalDiscipline
                  );
                  let title;
                  if (
                    selectedAdditionalDiscipline in
                    locales.additionalDisciplines
                  ) {
                    type LocaleKey = keyof typeof locales.additionalDisciplines;
                    title =
                      locales.additionalDisciplines[
                        selectedAdditionalDiscipline as LocaleKey
                      ].title;
                  } else {
                    console.error(
                      `Additional discipline ${selectedAdditionalDiscipline} not found in locales`
                    );
                    title = selectedAdditionalDiscipline;
                  }
                  return (
                    <ConformForm
                      key={selectedAdditionalDiscipline}
                      useFormOptions={{
                        id: `delete-filter-${selectedAdditionalDiscipline}`,
                        defaultValue: {
                          ...loaderData.submission.value,
                          prjFilter: {
                            ...loaderData.submission.value.prjFilter,
                            additionalDiscipline:
                              loaderData.submission.value.prjFilter.additionalDiscipline.filter(
                                (additionalDiscipline) =>
                                  additionalDiscipline !==
                                  selectedAdditionalDiscipline
                              ),
                          },
                          showFilters: "",
                        },
                        constraint: getZodConstraint(getFilterSchemes),
                        lastResult:
                          navigation.state === "idle"
                            ? loaderData.submission
                            : null,
                      }}
                      formProps={{
                        method: "get",
                        preventScrollReset: true,
                      }}
                    >
                      <HiddenFilterInputsInContext />
                      <Chip size="medium">
                        {title}
                        <Chip.Delete>
                          <button
                            type="submit"
                            disabled={navigation.state === "loading"}
                          >
                            X
                          </button>
                        </Chip.Delete>
                      </Chip>
                    </ConformForm>
                  );
                }
              )}
              {loaderData.selectedTargetGroups.map((selectedTargetGroup) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  prjFilterFieldset.projectTargetGroup.name,
                  selectedTargetGroup
                );
                let title;
                if (selectedTargetGroup in locales.projectTargetGroups) {
                  type LocaleKey = keyof typeof locales.projectTargetGroups;
                  title =
                    locales.projectTargetGroups[
                      selectedTargetGroup as LocaleKey
                    ].title;
                } else {
                  console.error(
                    `Project target group ${selectedTargetGroup} not found in locales`
                  );
                  title = selectedTargetGroup;
                }
                return (
                  <ConformForm
                    key={selectedTargetGroup}
                    useFormOptions={{
                      id: `delete-filter-${selectedTargetGroup}`,
                      defaultValue: {
                        ...loaderData.submission.value,
                        prjFilter: {
                          ...loaderData.submission.value.prjFilter,
                          projectTargetGroup:
                            loaderData.submission.value.prjFilter.projectTargetGroup.filter(
                              (projectTargetGroup) =>
                                projectTargetGroup !== selectedTargetGroup
                            ),
                        },
                        showFilters: "",
                      },
                      constraint: getZodConstraint(getFilterSchemes),
                      lastResult:
                        navigation.state === "idle"
                          ? loaderData.submission
                          : null,
                    }}
                    formProps={{
                      method: "get",
                      preventScrollReset: true,
                    }}
                  >
                    <HiddenFilterInputsInContext />
                    <Chip size="medium">
                      {title}
                      <Chip.Delete>
                        <button
                          type="submit"
                          disabled={navigation.state === "loading"}
                        >
                          X
                        </button>
                      </Chip.Delete>
                    </Chip>
                  </ConformForm>
                );
              })}
              {loaderData.selectedAreas.map((selectedArea) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  prjFilterFieldset.area.name,
                  selectedArea.slug
                );
                return selectedArea.name !== null ? (
                  <ConformForm
                    key={selectedArea.slug}
                    useFormOptions={{
                      id: `delete-filter-${selectedArea.slug}`,
                      defaultValue: {
                        ...loaderData.submission.value,
                        prjFilter: {
                          ...loaderData.submission.value.prjFilter,
                          area: loaderData.submission.value.prjFilter.area.filter(
                            (area) => area !== selectedArea.slug
                          ),
                        },
                        showFilters: "",
                      },
                      constraint: getZodConstraint(getFilterSchemes),
                      lastResult:
                        navigation.state === "idle"
                          ? loaderData.submission
                          : null,
                    }}
                    formProps={{
                      method: "get",
                      preventScrollReset: true,
                    }}
                  >
                    <HiddenFilterInputsInContext />
                    <Chip size="medium">
                      {selectedArea.name}
                      <Chip.Delete>
                        <button
                          type="submit"
                          disabled={navigation.state === "loading"}
                        >
                          X
                        </button>
                      </Chip.Delete>
                    </Chip>
                  </ConformForm>
                ) : null;
              })}
              {loaderData.selectedFormats.map((selectedFormat) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  prjFilterFieldset.format.name,
                  selectedFormat
                );
                let title;
                if (selectedFormat in locales.formats) {
                  type LocaleKey = keyof typeof locales.formats;
                  title = locales.formats[selectedFormat as LocaleKey].title;
                } else {
                  console.error(
                    `Format ${selectedFormat} not found in locales`
                  );
                  title = selectedFormat;
                }
                return (
                  <ConformForm
                    key={selectedFormat}
                    useFormOptions={{
                      id: `delete-filter-${selectedFormat}`,
                      defaultValue: {
                        ...loaderData.submission.value,
                        prjFilter: {
                          ...loaderData.submission.value.prjFilter,
                          format:
                            loaderData.submission.value.prjFilter.format.filter(
                              (format) => format !== selectedFormat
                            ),
                        },
                        showFilters: "",
                      },
                      constraint: getZodConstraint(getFilterSchemes),
                      lastResult:
                        navigation.state === "idle"
                          ? loaderData.submission
                          : null,
                    }}
                    formProps={{
                      method: "get",
                      preventScrollReset: true,
                    }}
                  >
                    <HiddenFilterInputsInContext />
                    <Chip size="medium">
                      {title}
                      <Chip.Delete>
                        <button
                          type="submit"
                          disabled={navigation.state === "loading"}
                        >
                          X
                        </button>
                      </Chip.Delete>
                    </Chip>
                  </ConformForm>
                );
              })}
              {loaderData.selectedSpecialTargetGroups.map(
                (selectedSpecialTargetGroup) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(
                    prjFilterFieldset.specialTargetGroup.name,
                    selectedSpecialTargetGroup
                  );
                  let title;
                  if (
                    selectedSpecialTargetGroup in locales.specialTargetGroups
                  ) {
                    type LocaleKey = keyof typeof locales.specialTargetGroups;
                    title =
                      locales.specialTargetGroups[
                        selectedSpecialTargetGroup as LocaleKey
                      ].title;
                  } else {
                    console.error(
                      `Special target group ${selectedSpecialTargetGroup} not found in locales`
                    );
                    title = selectedSpecialTargetGroup;
                  }
                  return (
                    <ConformForm
                      key={selectedSpecialTargetGroup}
                      useFormOptions={{
                        id: `delete-filter-${selectedSpecialTargetGroup}`,
                        defaultValue: {
                          ...loaderData.submission.value,
                          prjFilter: {
                            ...loaderData.submission.value.prjFilter,
                            specialTargetGroup:
                              loaderData.submission.value.prjFilter.specialTargetGroup.filter(
                                (specialTargetGroup) =>
                                  specialTargetGroup !==
                                  selectedSpecialTargetGroup
                              ),
                          },
                          showFilters: "",
                        },
                        constraint: getZodConstraint(getFilterSchemes),
                        lastResult:
                          navigation.state === "idle"
                            ? loaderData.submission
                            : null,
                      }}
                      formProps={{
                        method: "get",
                        preventScrollReset: true,
                      }}
                    >
                      <HiddenFilterInputsInContext />
                      <Chip size="medium">
                        {title}
                        <Chip.Delete>
                          <button
                            type="submit"
                            disabled={navigation.state === "loading"}
                          >
                            X
                          </button>
                        </Chip.Delete>
                      </Chip>
                    </ConformForm>
                  );
                }
              )}
              {loaderData.selectedFinancings.map((selectedFinancing) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  prjFilterFieldset.financing.name,
                  selectedFinancing
                );
                let title;
                if (selectedFinancing in locales.financings) {
                  type LocaleKey = keyof typeof locales.financings;
                  title =
                    locales.financings[selectedFinancing as LocaleKey].title;
                } else {
                  console.error(
                    `Financing ${selectedFinancing} not found in locales`
                  );
                  title = selectedFinancing;
                }
                return (
                  <ConformForm
                    key={selectedFinancing}
                    useFormOptions={{
                      id: `delete-filter-${selectedFinancing}`,
                      defaultValue: {
                        ...loaderData.submission.value,
                        prjFilter: {
                          ...loaderData.submission.value.prjFilter,
                          financing:
                            loaderData.submission.value.prjFilter.financing.filter(
                              (financing) => financing !== selectedFinancing
                            ),
                        },
                        showFilters: "",
                      },
                      constraint: getZodConstraint(getFilterSchemes),
                      lastResult:
                        navigation.state === "idle"
                          ? loaderData.submission
                          : null,
                    }}
                    formProps={{
                      method: "get",
                      preventScrollReset: true,
                    }}
                  >
                    <HiddenFilterInputsInContext />
                    <Chip size="medium">
                      {title}
                      <Chip.Delete>
                        <button
                          type="submit"
                          disabled={navigation.state === "loading"}
                        >
                          X
                        </button>
                      </Chip.Delete>
                    </Chip>
                  </ConformForm>
                );
              })}
            </div>
            <Form
              {...getFormProps(resetForm)}
              method="get"
              preventScrollReset
              className="mv-w-fit"
            >
              <HiddenFilterInputs
                fields={resetFields}
                defaultValue={loaderData.submission.value}
              />
              <Button
                type="submit"
                variant="outline"
                loading={navigation.state === "loading"}
                disabled={navigation.state === "loading"}
              >
                {locales.route.filter.reset}
              </Button>
            </Form>
          </div>
        )}
      </section>

      <section className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        {typeof loaderData.filteredByVisibilityCount !== "undefined" &&
        loaderData.filteredByVisibilityCount !== loaderData.projectsCount ? (
          <p className="mv-text-center mv-text-gray-700 mv-mb-4 mv-mx-4 @md:mv-mx-0">
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                locales.route.notShown_one,
                locales.route.notShown_other,
                loaderData.projectsCount - loaderData.filteredByVisibilityCount
              ),
              {
                count:
                  loaderData.projectsCount -
                  loaderData.filteredByVisibilityCount,
              }
            )}
          </p>
        ) : loaderData.projectsCount === 0 ? (
          <p className="mv-text-center mv-text-gray-700 mv-mb-4">
            {locales.route.empty}
          </p>
        ) : null}
        {loaderData.projects.length > 0 && (
          <>
            <CardContainer type="multi row">
              {loaderData.projects.map((project) => {
                return (
                  <ProjectCard
                    locales={locales}
                    key={`project-${project.id}`}
                    project={project}
                    as="h2"
                  />
                );
              })}
            </CardContainer>
            {showMore && (
              <div className="mv-w-full mv-flex mv-justify-center mv-mb-10 mv-mt-4 @lg:mv-mb-12 @lg:mv-mt-6 @xl:mv-mb-14 @xl:mv-mt-8">
                <Form
                  {...getFormProps(loadMoreForm)}
                  method="get"
                  preventScrollReset
                  replace
                >
                  <HiddenFilterInputs
                    fields={loadMoreFields}
                    defaultValue={loaderData.submission.value}
                  />
                  <Button
                    type="submit"
                    size="large"
                    variant="outline"
                    loading={navigation.state === "loading"}
                    disabled={navigation.state === "loading"}
                  >
                    {locales.route.more}
                  </Button>
                </Form>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
