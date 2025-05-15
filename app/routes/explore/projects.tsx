import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { ProjectCard } from "@mint-vernetzt/components/src/organisms/cards/ProjectCard";
import type { LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  redirect,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { useDebounceSubmit } from "remix-utils/use-debounce-submit";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import {
  filterOrganizationByVisibility,
  filterProjectByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { Dropdown } from "~/components-next/Dropdown";
import { Filters, ShowFiltersButton } from "~/components-next/Filters";
import { FormControl } from "~/components-next/FormControl";
import {
  getAllAdditionalDisciplines,
  getAllDisciplines,
  getAllFinancings,
  getAllFormats,
  getAllProjectTargetGroups,
  getAllProjects,
  getAllSpecialTargetGroups,
  getFilterCountForSlug,
  getProjectFilterVectorForAttribute,
  getProjectIds,
  getTakeParam,
} from "./projects.server";
import { getAreaNameBySlug, getAreasBySearchQuery } from "./utils.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { DefaultImages } from "~/images.shared";
import { getFilterSchemes, type FilterSchemes } from "./index";
import { useState } from "react";

export const PROJECT_SORT_VALUES = [
  "name-asc",
  "name-desc",
  "createdAt-desc",
] as const;

export type GetProjectsSchema = z.infer<typeof getProjectsSchema>;

export const getProjectsSchema = z.object({
  prjFilter: z
    .object({
      discipline: z.array(z.string()),
      additionalDiscipline: z.array(z.string()),
      projectTargetGroup: z.array(z.string()),
      area: z.array(z.string()),
      format: z.array(z.string()),
      specialTargetGroup: z.array(z.string()),
      financing: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (filter === undefined) {
        return {
          discipline: [],
          additionalDiscipline: [],
          projectTargetGroup: [],
          area: [],
          format: [],
          specialTargetGroup: [],
          financing: [],
        };
      }
      return filter;
    }),
  prjSortBy: z
    .enum(PROJECT_SORT_VALUES)
    .optional()
    .transform((sortValue) => {
      if (sortValue !== undefined) {
        const splittedValue = sortValue.split("-");
        return {
          value: splittedValue[0],
          direction: splittedValue[1],
        };
      }
      return {
        value: PROJECT_SORT_VALUES[0].split("-")[0],
        direction: PROJECT_SORT_VALUES[0].split("-")[1],
      };
    }),
  prjPage: z
    .number()
    .optional()
    .transform((page) => {
      if (page === undefined) {
        return 1;
      }
      return page;
    }),
  prjAreaSearch: z
    .string()
    .optional()
    .transform((searchQuery) => {
      if (searchQuery === undefined) {
        return "";
      }
      return searchQuery;
    }),
  showFilters: z.boolean().optional(),
});

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
      isChecked: boolean;
    }
  >;
  const enhancedAreas = {
    global: [] as EnhancedAreas,
    country: [] as EnhancedAreas,
    state: [] as EnhancedAreas,
    district: [] as EnhancedAreas,
  };
  const areaFilterVector = await getProjectFilterVectorForAttribute({
    attribute: "area",
    filter: submission.value.prjFilter,
    search: submission.value.search,
    ids: projectIds,
  });
  for (const area of areas) {
    const vectorCount = getFilterCountForSlug(
      area.slug,
      areaFilterVector,
      "area"
    );
    const isChecked = submission.value.prjFilter.area.includes(area.slug);
    const enhancedArea = {
      ...area,
      vectorCount,
      isChecked,
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
  const disciplineFilterVector = await getProjectFilterVectorForAttribute({
    attribute: "discipline",
    filter: submission.value.prjFilter,
    search: submission.value.search,
    ids: projectIds,
  });
  const enhancedDisciplines = disciplines.map((discipline) => {
    const vectorCount = getFilterCountForSlug(
      discipline.slug,
      disciplineFilterVector,
      "discipline"
    );
    const isChecked = submission.value.prjFilter.discipline.includes(
      discipline.slug
    );
    return { ...discipline, vectorCount, isChecked };
  });

  const additionalDisciplines = await getAllAdditionalDisciplines();
  const additionalDisciplineFilterVector =
    await getProjectFilterVectorForAttribute({
      attribute: "additionalDiscipline",
      filter: submission.value.prjFilter,
      search: submission.value.search,
      ids: projectIds,
    });
  const enhancedAdditionalDisciplines = additionalDisciplines.map(
    (additionalDiscipline) => {
      const vectorCount = getFilterCountForSlug(
        additionalDiscipline.slug,
        additionalDisciplineFilterVector,
        "additionalDiscipline"
      );
      const isChecked =
        submission.value.prjFilter.additionalDiscipline.includes(
          additionalDiscipline.slug
        );
      return { ...additionalDiscipline, vectorCount, isChecked };
    }
  );

  const targetGroups = await getAllProjectTargetGroups();
  const targetGroupFilterVector = await getProjectFilterVectorForAttribute({
    attribute: "projectTargetGroup",
    filter: submission.value.prjFilter,
    search: submission.value.search,
    ids: projectIds,
  });
  const enhancedTargetGroups = targetGroups.map((targetGroup) => {
    const vectorCount = getFilterCountForSlug(
      targetGroup.slug,
      targetGroupFilterVector,
      "projectTargetGroup"
    );
    const isChecked = submission.value.prjFilter.projectTargetGroup.includes(
      targetGroup.slug
    );
    return { ...targetGroup, vectorCount, isChecked };
  });

  const formats = await getAllFormats();
  const formatFilterVector = await getProjectFilterVectorForAttribute({
    attribute: "format",
    filter: submission.value.prjFilter,
    search: submission.value.search,
    ids: projectIds,
  });
  const enhancedFormats = formats.map((format) => {
    const vectorCount = getFilterCountForSlug(
      format.slug,
      formatFilterVector,
      "format"
    );
    const isChecked = submission.value.prjFilter.format.includes(format.slug);
    return { ...format, vectorCount, isChecked };
  });

  const specialTargetGroups = await getAllSpecialTargetGroups();
  const specialTargetGroupFilterVector =
    await getProjectFilterVectorForAttribute({
      attribute: "specialTargetGroup",
      filter: submission.value.prjFilter,
      search: submission.value.search,
      ids: projectIds,
    });
  const enhancedSpecialTargetGroups = specialTargetGroups.map(
    (specialTargetGroup) => {
      const vectorCount = getFilterCountForSlug(
        specialTargetGroup.slug,
        specialTargetGroupFilterVector,
        "specialTargetGroup"
      );
      const isChecked = submission.value.prjFilter.specialTargetGroup.includes(
        specialTargetGroup.slug
      );
      return { ...specialTargetGroup, vectorCount, isChecked };
    }
  );

  const financings = await getAllFinancings();
  const financingFilterVector = await getProjectFilterVectorForAttribute({
    attribute: "financing",
    filter: submission.value.prjFilter,
    search: submission.value.search,
    ids: projectIds,
  });
  const enhancedFinancings = financings.map((financing) => {
    const vectorCount = getFilterCountForSlug(
      financing.slug,
      financingFilterVector,
      "financing"
    );
    const isChecked = submission.value.prjFilter.financing.includes(
      financing.slug
    );
    return { ...financing, vectorCount, isChecked };
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
  const location = useLocation();
  const submit = useSubmit();
  const debounceSubmit = useDebounceSubmit();

  const [form, fields] = useForm<FilterSchemes>({});

  const filter = fields.prjFilter.getFieldset();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set(
    "prjPage",
    `${loaderData.submission.value.prjPage + 1}`
  );

  const [searchQuery, setSearchQuery] = useState(
    loaderData.submission.value.prjAreaSearch
  );

  const additionalSearchParams: { key: string; value: string }[] = [];
  const schemaKeys = getProjectsSchema.keyof().options as string[];
  searchParams.forEach((value, key) => {
    const isIncluded = schemaKeys.some((schemaKey) => {
      return schemaKey === key || key.startsWith(`${schemaKey}.`);
    });
    if (isIncluded === false) {
      additionalSearchParams.push({ key, value });
    }
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
            submit(event.currentTarget, { preventScrollReset });
          }}
        >
          <input name="prjPage" defaultValue="1" hidden />
          <input name="showFilters" defaultValue="on" hidden />
          {additionalSearchParams.map((param, index) => {
            return (
              <input
                key={`${param.key}-${index}`}
                name={param.key}
                defaultValue={param.value}
                hidden
              />
            );
          })}
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
                    return (
                      <FormControl
                        {...getInputProps(filter.discipline, {
                          type: "checkbox",
                          value: discipline.slug,
                        })}
                        key={discipline.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={discipline.isChecked}
                        readOnly
                        disabled={
                          discipline.vectorCount === 0 && !discipline.isChecked
                        }
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
                      return (
                        <FormControl
                          {...getInputProps(filter.additionalDiscipline, {
                            type: "checkbox",
                            value: additionalDiscipline.slug,
                          })}
                          key={additionalDiscipline.slug}
                          // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                          // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                          defaultChecked={undefined}
                          checked={additionalDiscipline.isChecked}
                          readOnly
                          disabled={
                            additionalDiscipline.vectorCount === 0 &&
                            !additionalDiscipline.isChecked
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
                    return (
                      <FormControl
                        {...getInputProps(filter.projectTargetGroup, {
                          type: "checkbox",
                          value: targetGroup.slug,
                        })}
                        key={targetGroup.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={targetGroup.isChecked}
                        readOnly
                        disabled={
                          targetGroup.vectorCount === 0 &&
                          !targetGroup.isChecked
                        }
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
                    return (
                      <FormControl
                        {...getInputProps(filter.area, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={area.isChecked}
                        readOnly
                        disabled={area.vectorCount === 0 && !area.isChecked}
                      >
                        <FormControl.Label>{area.name}</FormControl.Label>
                        <FormControl.Counter>
                          {area.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                  {loaderData.areas.country.map((area) => {
                    return (
                      <FormControl
                        {...getInputProps(filter.area, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={area.isChecked}
                        readOnly
                        disabled={area.vectorCount === 0 && !area.isChecked}
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
                          {...getInputProps(filter.area, {
                            type: "checkbox",
                            value: selectedArea.slug,
                          })}
                          key={selectedArea.slug}
                          // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                          // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                          defaultChecked={undefined}
                          checked
                          readOnly
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
                      id={fields.prjAreaSearch.id}
                      name={fields.prjAreaSearch.name}
                      type="text"
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.currentTarget.value);
                        event.stopPropagation();
                        debounceSubmit(event.currentTarget.form, {
                          debounceTimeout: 250,
                          preventScrollReset: true,
                          replace: true,
                        });
                      }}
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
                      return (
                        <FormControl
                          {...getInputProps(filter.area, {
                            type: "checkbox",
                            value: area.slug,
                          })}
                          key={area.slug}
                          // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                          // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                          defaultChecked={undefined}
                          checked={area.isChecked}
                          readOnly
                          disabled={area.vectorCount === 0 && !area.isChecked}
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
                      return (
                        <FormControl
                          {...getInputProps(filter.area, {
                            type: "checkbox",
                            value: area.slug,
                          })}
                          key={area.slug}
                          // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                          // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                          defaultChecked={undefined}
                          checked={area.isChecked}
                          readOnly
                          disabled={area.vectorCount === 0 && !area.isChecked}
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
                    return (
                      <FormControl
                        {...getInputProps(filter.format, {
                          type: "checkbox",
                          value: format.slug,
                        })}
                        key={format.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={format.isChecked}
                        readOnly
                        disabled={format.vectorCount === 0 && !format.isChecked}
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
                    return (
                      <FormControl
                        {...getInputProps(filter.specialTargetGroup, {
                          type: "checkbox",
                          value: targetGroup.slug,
                        })}
                        key={targetGroup.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={targetGroup.isChecked}
                        readOnly
                        disabled={
                          targetGroup.vectorCount === 0 &&
                          !targetGroup.isChecked
                        }
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
                    return (
                      <FormControl
                        {...getInputProps(filter.financing, {
                          type: "checkbox",
                          value: financing.slug,
                        })}
                        key={financing.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={financing.isChecked}
                        readOnly
                        disabled={
                          financing.vectorCount === 0 && !financing.isChecked
                        }
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
                    {(() => {
                      const currentValue = `${loaderData.submission.value.prjSortBy.value}-${loaderData.submission.value.prjSortBy.direction}`;
                      let value;
                      if (currentValue in locales.route.filter.sortBy.values) {
                        type LocaleKey =
                          keyof typeof locales.route.filter.sortBy.values;
                        value =
                          locales.route.filter.sortBy.values[
                            currentValue as LocaleKey
                          ];
                      } else {
                        console.error(
                          `Sort by value ${currentValue} not found in locales`
                        );
                        value = currentValue;
                      }
                      return value;
                    })()}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {PROJECT_SORT_VALUES.map((sortValue) => {
                    const submissionSortValue = `${loaderData.submission.value.prjSortBy.value}-${loaderData.submission.value.prjSortBy.direction}`;
                    return (
                      <FormControl
                        {...getInputProps(fields.prjSortBy, {
                          type: "radio",
                          value: sortValue,
                        })}
                        key={sortValue}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={submissionSortValue === sortValue}
                        readOnly
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
            <Filters.ResetButton
              to={`${location.pathname}${
                loaderData.submission.value.prjSortBy !== undefined
                  ? `?prjSortBy=${loaderData.submission.value.prjSortBy.value}-${loaderData.submission.value.prjSortBy.direction}`
                  : ""
              }`}
            >
              {locales.route.filter.reset}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {decideBetweenSingularOrPlural(
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
              )}
            </Filters.ApplyButton>
          </Filters>
          <noscript>
            <Button>{locales.route.filter.apply}</Button>
          </noscript>
        </Form>
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
        <hr className="mv-border-t mv-border-gray-200 mv-mt-4" />
      </div>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mb-6">
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
                  filter.discipline.name,
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
                  <Chip key={selectedDiscipline} size="medium">
                    {title}
                    <Chip.Delete>
                      <Link
                        to={`${
                          location.pathname
                        }?${deleteSearchParams.toString()}`}
                        preventScrollReset
                      >
                        X
                      </Link>
                    </Chip.Delete>
                  </Chip>
                );
              })}
              {loaderData.selectedAdditionalDisciplines.map(
                (selectedAdditionalDiscipline) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(
                    filter.additionalDiscipline.name,
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
                    <Chip key={selectedAdditionalDiscipline} size="medium">
                      {title}
                      <Chip.Delete>
                        <Link
                          to={`${
                            location.pathname
                          }?${deleteSearchParams.toString()}`}
                          preventScrollReset
                        >
                          X
                        </Link>
                      </Chip.Delete>
                    </Chip>
                  );
                }
              )}
              {loaderData.selectedTargetGroups.map((selectedTargetGroup) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  filter.projectTargetGroup.name,
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
                  <Chip key={selectedTargetGroup} size="medium">
                    {title}
                    <Chip.Delete>
                      <Link
                        to={`${
                          location.pathname
                        }?${deleteSearchParams.toString()}`}
                        preventScrollReset
                      >
                        X
                      </Link>
                    </Chip.Delete>
                  </Chip>
                );
              })}
              {loaderData.selectedAreas.map((selectedArea) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(filter.area.name, selectedArea.slug);
                return selectedArea.name !== null ? (
                  <Chip key={selectedArea.slug} size="medium">
                    {selectedArea.name}
                    <Chip.Delete>
                      <Link
                        to={`${
                          location.pathname
                        }?${deleteSearchParams.toString()}`}
                        preventScrollReset
                      >
                        X
                      </Link>
                    </Chip.Delete>
                  </Chip>
                ) : null;
              })}
              {loaderData.selectedFormats.map((selectedFormat) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(filter.format.name, selectedFormat);
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
                  <Chip key={selectedFormat} size="medium">
                    {title}
                    <Chip.Delete>
                      <Link
                        to={`${
                          location.pathname
                        }?${deleteSearchParams.toString()}`}
                        preventScrollReset
                      >
                        X
                      </Link>
                    </Chip.Delete>
                  </Chip>
                );
              })}
              {loaderData.selectedSpecialTargetGroups.map(
                (selectedSpecialTargetGroup) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(
                    filter.specialTargetGroup.name,
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
                    <Chip key={selectedSpecialTargetGroup} size="medium">
                      {title}
                      <Chip.Delete>
                        <Link
                          to={`${
                            location.pathname
                          }?${deleteSearchParams.toString()}`}
                          preventScrollReset
                        >
                          X
                        </Link>
                      </Chip.Delete>
                    </Chip>
                  );
                }
              )}
              {loaderData.selectedFinancings.map((selectedFinancing) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  filter.financing.name,
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
                  <Chip key={selectedFinancing} size="medium">
                    {title}
                    <Chip.Delete>
                      <Link
                        to={`${
                          location.pathname
                        }?${deleteSearchParams.toString()}`}
                        preventScrollReset
                      >
                        X
                      </Link>
                    </Chip.Delete>
                  </Chip>
                );
              })}
            </div>
            <Link
              className="mv-w-fit"
              to={`${location.pathname}${
                loaderData.submission.value.prjSortBy !== undefined
                  ? `?prjSortBy=${loaderData.submission.value.prjSortBy.value}-${loaderData.submission.value.prjSortBy.direction}`
                  : ""
              }`}
              preventScrollReset
            >
              <Button
                variant="outline"
                loading={navigation.state === "loading"}
                disabled={navigation.state === "loading"}
              >
                {locales.route.filter.reset}
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        {typeof loaderData.filteredByVisibilityCount !== "undefined" &&
        loaderData.filteredByVisibilityCount !== loaderData.projectsCount ? (
          <p className="text-center text-gray-700 mb-4 mv-mx-4 @md:mv-mx-0">
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
        ) : loaderData.projectsCount > 0 ? (
          <p className="text-center text-gray-700 mb-4">
            <strong>{loaderData.projectsCount}</strong>{" "}
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                locales.route.itemsCountSuffix_one,
                locales.route.itemsCountSuffix_other,
                loaderData.projectsCount
              ),
              { count: loaderData.projectsCount }
            )}
          </p>
        ) : (
          <p className="text-center text-gray-700 mb-4">
            {locales.route.empty}
          </p>
        )}
        {loaderData.projects.length > 0 && (
          <>
            <CardContainer type="multi row">
              {loaderData.projects.map((project) => {
                return (
                  <ProjectCard
                    locales={locales}
                    key={`project-${project.id}`}
                    project={project}
                  />
                );
              })}
            </CardContainer>
            {showMore && (
              <div className="mv-w-full mv-flex mv-justify-center mv-mb-10 mv-mt-4 @lg:mv-mb-12 @lg:mv-mt-6 @xl:mv-mb-14 @xl:mv-mt-8">
                <Link
                  to={`${location.pathname}?${loadMoreSearchParams.toString()}`}
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
        )}
      </section>
    </>
  );
}
