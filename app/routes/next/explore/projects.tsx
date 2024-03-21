import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { parseWithZod } from "@conform-to/zod-v1";
import {
  Button,
  CardContainer,
  Chip,
  Input,
  ProjectCard,
} from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useDebounceSubmit } from "remix-utils/use-debounce-submit";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { GravityType, getImageURL } from "~/images.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import {
  filterOrganizationByVisibility,
  filterProjectByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import {
  getAllDisciplines,
  getAllFinancings,
  getAllFormats,
  getAllProjectTargetGroups,
  getAllProjects,
  getAllSpecialTargetGroups,
  getFilterCountForSlug,
  getProjectFilterVector,
  getProjectsCount,
  getTakeParam,
  getVisibilityFilteredProjectsCount,
} from "./projects.server";
import { getAreaNameBySlug, getAreasBySearchQuery } from "./utils.server";
// import styles from "../../../common/design/styles/styles.css";

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

const i18nNS = ["routes/explore/projects"];
export const handle = {
  i18n: i18nNS,
};

const sortValues = ["name-asc", "name-desc", "createdAt-desc"] as const;

export type GetProjectsSchema = z.infer<typeof getProjectsSchema>;

const getProjectsSchema = z.object({
  filter: z
    .object({
      discipline: z.array(z.string()),
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
          projectTargetGroup: [],
          area: [],
          format: [],
          specialTargetGroup: [],
          financing: [],
        };
      }
      return filter;
    }),
  sortBy: z
    .enum(sortValues)
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
        value: sortValues[0].split("-")[0],
        direction: sortValues[0].split("-")[1],
      };
    }),
  page: z
    .number()
    .optional()
    .transform((page) => {
      if (page === undefined) {
        return 1;
      }
      return page;
    }),
  search: z
    .string()
    .optional()
    .transform((searchQuery) => {
      if (searchQuery === undefined) {
        return "";
      }
      return searchQuery;
    }),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const submission = parseWithZod(searchParams, {
    schema: getProjectsSchema,
  });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );
  const take = getTakeParam(submission.value.page);
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["filter"]);
  if (abilities.filter.hasAccess === false) {
    return redirect("/explore/projects");
  }

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let filteredByVisibilityCount;
  if (!isLoggedIn) {
    filteredByVisibilityCount = await getVisibilityFilteredProjectsCount({
      filter: submission.value.filter,
    });
  }
  const projectsCount = await getProjectsCount({
    filter: submission.value.filter,
  });
  const projects = await getAllProjects({
    filter: submission.value.filter,
    sortBy: submission.value.sortBy,
    take,
    isLoggedIn,
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

    // const transformedProject = {
    //   ...enhancedProject,
    //   teamMembers: enhancedProject.teamMembers.map((relation) => {
    //     return relation.profile;
    //   }),
    //   types: enhancedProject.types.map((relation) => {
    //     return relation.organizationType.title;
    //   }),
    //   focuses: enhancedProject.focuses.map((relation) => {
    //     return relation.focus.title;
    //   }),
    //   areas: enhancedProject.areas.map((relation) => {
    //     return relation.area.name;
    //   }),
    // };

    enhancedProjects.push(enhancedProject);
  }

  const filterVector = await getProjectFilterVector({
    filter: submission.value.filter,
  });

  const areas = await getAreasBySearchQuery(submission.value.search);
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
  for (const area of areas) {
    const vectorCount = getFilterCountForSlug(area.slug, filterVector, "area");
    let isChecked;
    // TODO: Remove 'area.slug === null' when slug isn't optional anymore (after migration)
    if (area.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.area.includes(area.slug);
    }
    const enhancedArea = {
      ...area,
      vectorCount,
      isChecked,
    };
    enhancedAreas[area.type].push(enhancedArea);
  }
  const selectedAreas = await Promise.all(
    submission.value.filter.area.map(async (slug) => {
      const vectorCount = getFilterCountForSlug(slug, filterVector, "area");
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
  const enhancedDisciplines = disciplines.map((discipline) => {
    const vectorCount = getFilterCountForSlug(
      discipline.slug,
      filterVector,
      "discipline"
    );
    let isChecked;
    // TODO: Remove 'discipline.slug === null' when slug isn't optional anymore (after migration)
    if (discipline.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.discipline.includes(discipline.slug);
    }
    return { ...discipline, vectorCount, isChecked };
  });
  const selectedDisciplines = submission.value.filter.discipline.map((slug) => {
    const disciplineMatch = disciplines.find((discipline) => {
      return discipline.slug === slug;
    });
    return {
      slug,
      title: disciplineMatch?.title || null,
    };
  });

  const targetGroups = await getAllProjectTargetGroups();
  const enhancedTargetGroups = targetGroups.map((targetGroup) => {
    const vectorCount = getFilterCountForSlug(
      targetGroup.slug,
      filterVector,
      "projectTargetGroup"
    );
    let isChecked;
    // TODO: Remove 'targetGroup.slug === null' when slug isn't optional anymore (after migration)
    if (targetGroup.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.projectTargetGroup.includes(
        targetGroup.slug
      );
    }
    return { ...targetGroup, vectorCount, isChecked };
  });
  const selectedTargetGroups = submission.value.filter.projectTargetGroup.map(
    (slug) => {
      const targetGroupMatch = targetGroups.find((targetGroup) => {
        return targetGroup.slug === slug;
      });
      return {
        slug,
        title: targetGroupMatch?.title || null,
      };
    }
  );

  const formats = await getAllFormats();
  const enhancedFormats = formats.map((format) => {
    const vectorCount = getFilterCountForSlug(
      format.slug,
      filterVector,
      "format"
    );
    let isChecked;
    // TODO: Remove 'format.slug === null' when slug isn't optional anymore (after migration)
    if (format.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.format.includes(format.slug);
    }
    return { ...format, vectorCount, isChecked };
  });
  const selectedFormats = submission.value.filter.format.map((slug) => {
    const formatMatch = formats.find((format) => {
      return format.slug === slug;
    });
    return {
      slug,
      title: formatMatch?.title || null,
    };
  });

  const specialTargetGroups = await getAllSpecialTargetGroups();
  const enhancedSpecialTargetGroups = specialTargetGroups.map(
    (specialTargetGroup) => {
      const vectorCount = getFilterCountForSlug(
        specialTargetGroup.slug,
        filterVector,
        "specialTargetGroup"
      );
      let isChecked;
      // TODO: Remove 'specialTargetGroup.slug === null' when slug isn't optional anymore (after migration)
      if (specialTargetGroup.slug === null) {
        isChecked = false;
      } else {
        isChecked = submission.value.filter.specialTargetGroup.includes(
          specialTargetGroup.slug
        );
      }
      return { ...specialTargetGroup, vectorCount, isChecked };
    }
  );
  const selectedSpecialTargetGroups =
    submission.value.filter.specialTargetGroup.map((slug) => {
      const specialTargetGroupMatch = specialTargetGroups.find(
        (specialTargetGroup) => {
          return specialTargetGroup.slug === slug;
        }
      );
      return {
        slug,
        title: specialTargetGroupMatch?.title || null,
      };
    });

  const financings = await getAllFinancings();
  const enhancedFinancings = financings.map((financing) => {
    const vectorCount = getFilterCountForSlug(
      financing.slug,
      filterVector,
      "financing"
    );
    let isChecked;
    // TODO: Remove 'financing.slug === null' when slug isn't optional anymore (after migration)
    if (financing.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.financing.includes(financing.slug);
    }
    return { ...financing, vectorCount, isChecked };
  });
  const selectedFinancings = submission.value.filter.financing.map((slug) => {
    const financingMatch = financings.find((financing) => {
      return financing.slug === slug;
    });
    return {
      slug,
      title: financingMatch?.title || null,
    };
  });

  return json({
    projects: enhancedProjects,
    disciplines: enhancedDisciplines,
    selectedDisciplines,
    targetGroups: enhancedTargetGroups,
    selectedTargetGroups,
    areas: enhancedAreas,
    selectedAreas,
    formats: enhancedFormats,
    selectedFormats,
    specialTargetGroups: enhancedSpecialTargetGroups,
    selectedSpecialTargetGroups,
    financings: enhancedFinancings,
    selectedFinancings,
    submission,
    filteredByVisibilityCount,
    projectsCount,
  });
};

export default function ExploreProjects() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const location = useLocation();
  const submit = useSubmit();
  const debounceSubmit = useDebounceSubmit();
  const { t } = useTranslation(i18nNS);

  const [form, fields] = useForm<GetProjectsSchema>({
    lastResult: loaderData.submission,
    defaultValue: loaderData.submission.value,
  });

  const filter = fields.filter.getFieldset();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${loaderData.submission.value.page + 1}`);

  const [searchQuery, setSearchQuery] = React.useState(
    loaderData.submission.value.search
  );

  return (
    <>
      <section className="mv-container mv-mb-12 mv-mt-5 md:mv-mt-7 lg:mv-mt-8 mv-text-center">
        <H1 className="mv-mb-4 md:mv-mb-2 lg:mv-mb-3" like="h0">
          {t("title")}
        </H1>
        <p>{t("intro")}</p>
      </section>

      <section className="mv-container mv-mb-12">
        <Form
          {...getFormProps(form)}
          method="get"
          onChange={(event) => {
            submit(event.currentTarget, { preventScrollReset: true });
          }}
          preventScrollReset
        >
          <input name="page" defaultValue="1" hidden />
          <div className="mv-flex mv-mb-8">
            <fieldset {...getFieldsetProps(fields.filter)} className="mv-flex">
              <div className="mv-mr-4">
                <legend className="mv-font-bold mb-2">
                  {t("filter.disciplines")}
                </legend>
                <ul>
                  {loaderData.disciplines.map((discipline) => {
                    return (
                      <li key={discipline.slug}>
                        <label htmlFor={filter.discipline.id} className="mr-2">
                          {discipline.title} ({discipline.vectorCount})
                        </label>
                        <input
                          {...getInputProps(filter.discipline, {
                            type: "checkbox",
                            // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                            value: discipline.slug || undefined,
                          })}
                          defaultChecked={discipline.isChecked}
                          disabled={
                            (discipline.vectorCount === 0 &&
                              !discipline.isChecked) ||
                            navigation.state === "loading"
                          }
                        />
                        {discipline.description !== null ? (
                          <p className="mv-text-sm">{discipline.description}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="mv-mr-4">
                <legend className="mv-font-bold mb-2">
                  {t("filter.targetGroups")}
                </legend>
                <ul>
                  {loaderData.targetGroups.map((targetGroup) => {
                    return (
                      <li key={targetGroup.slug}>
                        <label
                          htmlFor={filter.projectTargetGroup.id}
                          className="mr-2"
                        >
                          {targetGroup.title} ({targetGroup.vectorCount})
                        </label>
                        <input
                          {...getInputProps(filter.projectTargetGroup, {
                            type: "checkbox",
                            // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                            value: targetGroup.slug || undefined,
                          })}
                          defaultChecked={targetGroup.isChecked}
                          disabled={
                            (targetGroup.vectorCount === 0 &&
                              !targetGroup.isChecked) ||
                            navigation.state === "loading"
                          }
                        />
                        {targetGroup.description !== null ? (
                          <p className="mv-text-sm">
                            {targetGroup.description}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="mr-4">
                <legend className="font-bold mb-2">{t("filter.areas")}</legend>
                {loaderData.areas.global.map((area) => {
                  return (
                    <div key={area.slug}>
                      <label htmlFor={filter.area.id} className="mr-2">
                        {area.name} ({area.vectorCount})
                      </label>
                      <input
                        {...getInputProps(filter.area, {
                          type: "checkbox",
                          // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                          value: area.slug || undefined,
                        })}
                        defaultChecked={area.isChecked}
                        disabled={
                          (area.vectorCount === 0 && !area.isChecked) ||
                          navigation.state === "loading"
                        }
                      />
                    </div>
                  );
                })}
                {loaderData.areas.country.map((area) => {
                  return (
                    <div key={area.slug}>
                      <label htmlFor={filter.area.id} className="mr-2">
                        {area.name} ({area.vectorCount})
                      </label>
                      <input
                        {...getInputProps(filter.area, {
                          type: "checkbox",
                          // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                          value: area.slug || undefined,
                        })}
                        defaultChecked={area.isChecked}
                        disabled={
                          (area.vectorCount === 0 && !area.isChecked) ||
                          navigation.state === "loading"
                        }
                      />
                    </div>
                  );
                })}
                {loaderData.selectedAreas.length > 0 &&
                  loaderData.selectedAreas.map((selectedArea) => {
                    return selectedArea.name !== null &&
                      selectedArea.isInSearchResultsList === false ? (
                      <div key={selectedArea.slug}>
                        <label htmlFor={filter.area.id} className="mr-2">
                          {selectedArea.name} ({selectedArea.vectorCount})
                        </label>
                        <input
                          {...getInputProps(filter.area, {
                            type: "checkbox",
                            value: selectedArea.slug,
                          })}
                          defaultChecked={true}
                        />
                      </div>
                    ) : null;
                  })}
                <Input
                  id={fields.search.id}
                  name={fields.search.name}
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
                  placeholder={t("filter.searchAreaPlaceholder")}
                >
                  <Input.Label htmlFor={fields.search.id} hidden>
                    {t("filter.searchAreaPlaceholder")}
                  </Input.Label>
                  <Input.HelperText>
                    {t("filter.searchAreaHelper")}
                  </Input.HelperText>
                  <Input.Controls>
                    <noscript>
                      <Button>{t("filter.searchAreaButton")}</Button>
                    </noscript>
                  </Input.Controls>
                </Input>
                {loaderData.areas.state.length > 0 && (
                  <>
                    <legend className="font-bold mt-2">
                      {t("filter.stateLabel")}
                    </legend>
                    {loaderData.areas.state.map((area) => {
                      return (
                        <div key={area.slug}>
                          <label htmlFor={filter.area.id} className="mr-2">
                            {area.name} ({area.vectorCount})
                          </label>
                          <input
                            {...getInputProps(filter.area, {
                              type: "checkbox",
                              // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                              value: area.slug || undefined,
                            })}
                            defaultChecked={area.isChecked}
                            disabled={
                              (area.vectorCount === 0 && !area.isChecked) ||
                              navigation.state === "loading"
                            }
                          />
                        </div>
                      );
                    })}
                  </>
                )}
                {loaderData.areas.district.length > 0 && (
                  <>
                    <legend className="font-bold mt-2">
                      {t("filter.districtLabel")}
                    </legend>
                    {loaderData.areas.district.map((area) => {
                      return (
                        <div key={area.slug}>
                          <label htmlFor={filter.area.id} className="mr-2">
                            {area.name} ({area.vectorCount})
                          </label>
                          <input
                            {...getInputProps(filter.area, {
                              type: "checkbox",
                              // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                              value: area.slug || undefined,
                            })}
                            defaultChecked={area.isChecked}
                            disabled={
                              (area.vectorCount === 0 && !area.isChecked) ||
                              navigation.state === "loading"
                            }
                          />
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              <div className="mv-mr-4">
                <legend className="mv-font-bold mb-2">
                  {t("filter.formats")}
                </legend>
                <ul>
                  {loaderData.formats.map((format) => {
                    return (
                      <li key={format.slug}>
                        <label htmlFor={filter.format.id} className="mr-2">
                          {format.title} ({format.vectorCount})
                        </label>
                        <input
                          {...getInputProps(filter.format, {
                            type: "checkbox",
                            // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                            value: format.slug || undefined,
                          })}
                          defaultChecked={format.isChecked}
                          disabled={
                            (format.vectorCount === 0 && !format.isChecked) ||
                            navigation.state === "loading"
                          }
                        />
                        {format.description !== null ? (
                          <p className="mv-text-sm">{format.description}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="mv-mr-4">
                <legend className="mv-font-bold mb-2">
                  {t("filter.specialTargetGroups")}
                </legend>
                <ul>
                  {loaderData.specialTargetGroups.map((specialTargetGroup) => {
                    return (
                      <li key={specialTargetGroup.slug}>
                        <label
                          htmlFor={filter.specialTargetGroup.id}
                          className="mr-2"
                        >
                          {specialTargetGroup.title} (
                          {specialTargetGroup.vectorCount})
                        </label>
                        <input
                          {...getInputProps(filter.specialTargetGroup, {
                            type: "checkbox",
                            // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                            value: specialTargetGroup.slug || undefined,
                          })}
                          defaultChecked={specialTargetGroup.isChecked}
                          disabled={
                            (specialTargetGroup.vectorCount === 0 &&
                              !specialTargetGroup.isChecked) ||
                            navigation.state === "loading"
                          }
                        />
                        {specialTargetGroup.description !== null ? (
                          <p className="mv-text-sm">
                            {specialTargetGroup.description}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="mv-mr-4">
                <legend className="mv-font-bold mb-2">
                  {t("filter.financings")}
                </legend>
                <ul>
                  {loaderData.financings.map((financing) => {
                    return (
                      <li key={financing.slug}>
                        <label htmlFor={filter.financing.id} className="mr-2">
                          {financing.title} ({financing.vectorCount})
                        </label>
                        <input
                          {...getInputProps(filter.financing, {
                            type: "checkbox",
                            // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                            value: financing.slug || undefined,
                          })}
                          defaultChecked={financing.isChecked}
                          disabled={
                            (financing.vectorCount === 0 &&
                              !financing.isChecked) ||
                            navigation.state === "loading"
                          }
                        />
                        {financing.description !== null ? (
                          <p className="mv-text-sm">{financing.description}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </fieldset>
            <fieldset {...getFieldsetProps(fields.sortBy)}>
              {sortValues.map((sortValue) => {
                const submissionSortValue = `${loaderData.submission.value.sortBy.value}-${loaderData.submission.value.sortBy.direction}`;
                return (
                  <div key={sortValue}>
                    <label htmlFor={fields.sortBy.id} className="mr-2">
                      {t(`filter.sortBy.${sortValue}`)}
                    </label>
                    <input
                      {...getInputProps(fields.sortBy, {
                        type: "radio",
                        value: sortValue,
                      })}
                      defaultChecked={submissionSortValue === sortValue}
                      disabled={navigation.state === "loading"}
                    />
                  </div>
                );
              })}
            </fieldset>
          </div>
          <noscript>
            <Button>{t("filter.apply")}</Button>
          </noscript>
        </Form>
      </section>
      <section className="container mb-6">
        {(loaderData.selectedDisciplines.length > 0 ||
          loaderData.selectedTargetGroups.length > 0 ||
          loaderData.selectedAreas.length > 0 ||
          loaderData.selectedFormats.length > 0 ||
          loaderData.selectedSpecialTargetGroups.length > 0 ||
          loaderData.selectedFinancings.length > 0) && (
          <div className="flex items-center">
            <Chip.Container>
              {loaderData.selectedDisciplines.map((selectedDiscipline) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  filter.discipline.name,
                  selectedDiscipline.slug
                );
                return selectedDiscipline.title !== null ? (
                  <Chip key={selectedDiscipline.slug} responsive>
                    {selectedDiscipline.title}
                    <Chip.Delete disabled={navigation.state === "loading"}>
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
              {loaderData.selectedTargetGroups.map((selectedTargetGroup) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  filter.projectTargetGroup.name,
                  selectedTargetGroup.slug
                );
                return selectedTargetGroup.title !== null ? (
                  <Chip key={selectedTargetGroup.slug} responsive>
                    {selectedTargetGroup.title}
                    <Chip.Delete disabled={navigation.state === "loading"}>
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
              {loaderData.selectedAreas.map((selectedArea) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(filter.area.name, selectedArea.slug);
                return selectedArea.name !== null ? (
                  <Chip key={selectedArea.slug} responsive>
                    {selectedArea.name}
                    <Chip.Delete disabled={navigation.state === "loading"}>
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
                deleteSearchParams.delete(
                  filter.format.name,
                  selectedFormat.slug
                );
                return selectedFormat.title !== null ? (
                  <Chip key={selectedFormat.slug} responsive>
                    {selectedFormat.title}
                    <Chip.Delete disabled={navigation.state === "loading"}>
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
              {loaderData.selectedSpecialTargetGroups.map(
                (selectedSpecialTargetGroup) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(
                    filter.specialTargetGroup.name,
                    selectedSpecialTargetGroup.slug
                  );
                  return selectedSpecialTargetGroup.title !== null ? (
                    <Chip key={selectedSpecialTargetGroup.slug} responsive>
                      {selectedSpecialTargetGroup.title}
                      <Chip.Delete disabled={navigation.state === "loading"}>
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
                }
              )}
              {loaderData.selectedFinancings.map((selectedFinancing) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  filter.financing.name,
                  selectedFinancing.slug
                );
                return selectedFinancing.title !== null ? (
                  <Chip key={selectedFinancing.slug} responsive>
                    {selectedFinancing.title}
                    <Chip.Delete disabled={navigation.state === "loading"}>
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
            </Chip.Container>
            <Link
              to={`${location.pathname}${
                loaderData.submission.value.sortBy !== undefined
                  ? `?sortBy=${loaderData.submission.value.sortBy.value}-${loaderData.submission.value.sortBy.direction}`
                  : ""
              }`}
              preventScrollReset
              className="ml-2"
            >
              <Button
                variant="outline"
                loading={navigation.state === "loading"}
                disabled={navigation.state === "loading"}
              >
                {t("filter.reset")}
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        {loaderData.filteredByVisibilityCount !== undefined &&
        loaderData.filteredByVisibilityCount > 0 ? (
          <p className="text-center text-gray-700 mb-4">
            {loaderData.filteredByVisibilityCount} {t("notShown")}
          </p>
        ) : loaderData.projectsCount > 0 ? (
          <p className="text-center text-gray-700 mb-4">
            <strong>{loaderData.projectsCount}</strong>{" "}
            {t("projectsCountSuffix")}
          </p>
        ) : (
          <p className="text-center text-gray-700 mb-4">{t("empty")}</p>
        )}
        {loaderData.projects.length > 0 && (
          <>
            <CardContainer type="multi row">
              {loaderData.projects.map((project) => {
                return (
                  <ProjectCard
                    key={`project-${project.id}`}
                    project={project}
                  />
                );
              })}
            </CardContainer>
            {loaderData.projectsCount > loaderData.projects.length && (
              <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 md:mv-mb-24 lg:mv-mb-8 mv-mt-4 lg:mv-mt-8">
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
                    {t("more")}
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

/* OLD
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { skip, take, page, itemsPerPage } = getPaginationValues(request, {
    itemsPerPage: 8,
  });
  const { sortBy } = getSortValue(request);

  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["filter"]);

  if (abilities.filter.hasAccess === false) {
    return redirect("/explore/projects");
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
                  {t("filter.sortBy.nameAsc")}
                </option>
                <option key="nameDesc" value="nameDesc">
                  {t("filter.sortBy.nameDesc")}
                </option>
                <option key="newest" value="newest">
                  {t("filter.sortBy.newest")}
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
*/
