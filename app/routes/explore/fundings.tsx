import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import {
  Form,
  redirect,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
  type LoaderFunctionArgs,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { ConformForm } from "~/components-next/ConformForm";
import { Dropdown } from "~/components-next/Dropdown";
import { Filters, ShowFiltersButton } from "~/components-next/Filters";
import { FormControl } from "~/components-next/FormControl";
import { FundingCard } from "~/components-next/FundingCard";
import {
  HiddenFilterInputs,
  HiddenFilterInputsInContext,
} from "~/components-next/HiddenFilterInputs";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { getFilterSchemes, type FilterSchemes } from "./all.shared";
import {
  getAllFundings,
  getFilterCountForSlug,
  getFundingFilterVectorForAttribute,
  getFundingIds,
  getTakeParam,
} from "./fundings.server";
import { FUNDING_SORT_VALUES } from "./fundings.shared";

export async function loader(args: LoaderFunctionArgs) {
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

  invariantResponse(submission.status === "success", "Bad request", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["explore/fundings"];

  const take = getTakeParam(submission.value.fndPage);
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  const fundings = await getAllFundings({
    filter: submission.value.fndFilter,
    sortBy: submission.value.fndSortBy,
    search: submission.value.search,
    sessionUser,
    take,
    language,
  });

  const fundingIds = await getFundingIds({
    filter: submission.value.fndFilter,
    search: submission.value.search,
    sessionUser,
    language,
  });

  const count = fundingIds.length;

  const fundingTypes = await prismaClient.fundingType.findMany({
    where: {
      fundings: {
        some: {},
      },
    },
    select: {
      slug: true,
      title: true,
    },
    orderBy: {
      title: "asc",
    },
  });
  const typeFundingIds =
    submission.value.search.length > 0
      ? await getFundingIds({
          filter: { ...submission.value.fndFilter, types: [] },
          search: submission.value.search,
          sessionUser,
          language,
        })
      : fundingIds;
  const typeFilterVector = await getFundingFilterVectorForAttribute({
    attribute: "types",
    filter: submission.value.fndFilter,
    search: submission.value.search,
    ids: typeFundingIds,
  });
  const enhancedFundingTypes = fundingTypes
    .sort((a, b) => {
      if (a.title === "Sonstiges") {
        return 1;
      }
      if (b.title === "Sonstiges") {
        return -1;
      }
      return 0;
    })
    .map((type) => {
      const vectorCount = getFilterCountForSlug(
        type.slug,
        typeFilterVector,
        "types"
      );
      return {
        ...type,
        vectorCount,
      };
    });
  const selectedFundingTypes = submission.value.fndFilter.types.map((slug) => {
    const fundingTypeMatch = fundingTypes.find((type) => type.slug === slug);
    return {
      slug,
      title: fundingTypeMatch?.title || null,
    };
  });
  const fundingAreas = await prismaClient.fundingArea.findMany({
    where: {
      fundings: {
        some: {},
      },
    },
    select: {
      slug: true,
      title: true,
    },
    orderBy: {
      title: "asc",
    },
  });
  const areaFundingIds =
    submission.value.search.length > 0
      ? await getFundingIds({
          filter: { ...submission.value.fndFilter, areas: [] },
          search: submission.value.search,
          sessionUser,
          language,
        })
      : fundingIds;
  const areaFilterVector = await getFundingFilterVectorForAttribute({
    attribute: "areas",
    filter: submission.value.fndFilter,
    search: submission.value.search,
    ids: areaFundingIds,
  });
  const enhancedFundingAreas = fundingAreas
    .sort((a, b) => {
      if (a.title === "Sonstiges") {
        return 1;
      }
      if (b.title === "Sonstiges") {
        return -1;
      }
      return 0;
    })
    .map((area) => {
      const vectorCount = getFilterCountForSlug(
        area.slug,
        areaFilterVector,
        "areas"
      );
      return {
        ...area,
        vectorCount,
      };
    });
  const selectedFundingAreas = submission.value.fndFilter.areas.map((slug) => {
    const fundingAreaMatch = fundingAreas.find((area) => area.slug === slug);
    return {
      slug,
      title: fundingAreaMatch?.title || null,
    };
  });
  const eligibleEntities = await prismaClient.fundingEligibleEntity.findMany({
    where: {
      fundings: {
        some: {},
      },
    },
    select: {
      slug: true,
      title: true,
    },
    orderBy: {
      title: "asc",
    },
  });
  const eligibleFundingIds =
    submission.value.search.length > 0
      ? await getFundingIds({
          filter: { ...submission.value.fndFilter, eligibleEntities: [] },
          search: submission.value.search,
          sessionUser,
          language,
        })
      : fundingIds;
  const eligibleEntitiesFilterVector = await getFundingFilterVectorForAttribute(
    {
      attribute: "eligibleEntities",
      filter: submission.value.fndFilter,
      search: submission.value.search,
      ids: eligibleFundingIds,
    }
  );
  const enhancedEligibleEntities = eligibleEntities
    .sort((a, b) => {
      if (a.title === "Sonstiges") {
        return 1;
      }
      if (b.title === "Sonstiges") {
        return -1;
      }
      return 0;
    })
    .map((entity) => {
      const vectorCount = getFilterCountForSlug(
        entity.slug,
        eligibleEntitiesFilterVector,
        "eligibleEntities"
      );
      return {
        ...entity,
        vectorCount,
      };
    });
  const selectedEligibleEntities =
    submission.value.fndFilter.eligibleEntities.map((slug) => {
      const entityMatch = eligibleEntities.find(
        (entity) => entity.slug === slug
      );
      return {
        slug,
        title: entityMatch?.title || null,
      };
    });
  const regions = await prismaClient.area.findMany({
    where: {
      type: {
        not: "district",
      },
    },
    select: {
      slug: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
  const fundingRegionIds =
    submission.value.search.length > 0
      ? await getFundingIds({
          filter: { ...submission.value.fndFilter, regions: [] },
          search: submission.value.search,
          sessionUser,
          language,
        })
      : fundingIds;
  const regionFilterVector = await getFundingFilterVectorForAttribute({
    attribute: "regions",
    filter: submission.value.fndFilter,
    search: submission.value.search,
    ids: fundingRegionIds,
  });
  const enhancedRegions = regions
    .sort((a) => {
      if (a.name === "Bundesweit" || a.name === "International") {
        return -1;
      }
      return 0;
    })
    .map((region) => {
      const vectorCount = getFilterCountForSlug(
        region.slug,
        regionFilterVector,
        "regions"
      );
      return {
        ...region,
        vectorCount,
      };
    });
  const selectedRegions = submission.value.fndFilter.regions.map((slug) => {
    const regionMatch = regions.find((region) => region.slug === slug);
    return {
      slug,
      name: regionMatch?.name || null,
    };
  });

  return {
    fundings,
    fundingTypes: enhancedFundingTypes,
    selectedFundingTypes,
    fundingAreas: enhancedFundingAreas,
    selectedFundingAreas,
    regions: enhancedRegions,
    selectedRegions,
    eligibleEntities: enhancedEligibleEntities,
    selectedEligibleEntities,
    submission,
    count,
    locales,
  };
}

export default function ExploreFundings() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const isHydrated = useHydrated();
  const navigation = useNavigation();

  const [form, fields] = useForm<FilterSchemes>({
    id: "filter-fundings",
    defaultValue: {
      ...loaderData.submission.value,
      search: [loaderData.submission.value.search.join(" ")],
      showFilters: "on",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const fndFilterFieldset = fields.fndFilter.getFieldset();

  const [loadMoreForm, loadMoreFields] = useForm<FilterSchemes>({
    id: "load-more-fundings",
    defaultValue: {
      ...loaderData.submission.value,
      fndPage: loaderData.submission.value.fndPage + 1,
      search: [loaderData.submission.value.search.join(" ")],
      showFilters: "",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const [resetForm, resetFields] = useForm<FilterSchemes>({
    id: "reset-funding-filters",
    defaultValue: {
      ...loaderData.submission.value,
      fndFilter: {
        areas: [],
        types: [],
        regions: [],
        eligibleEntities: [],
      },
      fndPage: 1,
      fndSortBy: FUNDING_SORT_VALUES[0],
      search: [loaderData.submission.value.search.join(" ")],
      showFilters: "",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const currentSortValue = FUNDING_SORT_VALUES.find((value) => {
    return value === `${loaderData.submission.value.fndSortBy}`;
  });

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
            entityLeftOut="funding"
          />

          {/* Funding Filters */}
          <input {...getInputProps(fields.fndPage, { type: "hidden" })} />
          <ShowFiltersButton
            showFilters={loaderData.submission.value.showFilters}
          >
            {loaderData.locales.showFiltersLabel}
          </ShowFiltersButton>
          <Filters
            showFilters={searchParams.get(fields.showFilters.name) === "on"}
          >
            <Filters.Title>Filter</Filters.Title>
            <Filters.Fieldset
              className="mv-flex mv-flex-wrap @lg:mv-gap-4"
              {...getFieldsetProps(fields.fndFilter)}
              showMore={loaderData.locales.filter.showMore}
              showLess={loaderData.locales.filter.showLess}
              hideAfter={4}
            >
              <Dropdown>
                <Dropdown.Label>
                  {loaderData.locales.filter.type}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedFundingTypes
                      .map((type) => {
                        return type.title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.fundingTypes.map((type) => {
                    const isChecked =
                      fndFilterFieldset.types.initialValue &&
                      Array.isArray(fndFilterFieldset.types.initialValue)
                        ? fndFilterFieldset.types.initialValue.includes(
                            type.slug
                          )
                        : fndFilterFieldset.types.initialValue === type.slug;
                    return (
                      <FormControl
                        {...getInputProps(fndFilterFieldset.types, {
                          type: "checkbox",
                          value: type.slug,
                        })}
                        key={type.slug}
                        defaultChecked={isChecked}
                        disabled={type.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>{type.title}</FormControl.Label>
                        <FormControl.Counter>
                          {type.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {loaderData.locales.filter.area}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedFundingAreas
                      .map((area) => {
                        return area.title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.fundingAreas.map((area) => {
                    const isChecked =
                      fndFilterFieldset.areas.initialValue &&
                      Array.isArray(fndFilterFieldset.areas.initialValue)
                        ? fndFilterFieldset.areas.initialValue.includes(
                            area.slug
                          )
                        : fndFilterFieldset.areas.initialValue === area.slug;
                    return (
                      <FormControl
                        {...getInputProps(fndFilterFieldset.areas, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        defaultChecked={isChecked}
                        disabled={area.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>{area.title}</FormControl.Label>
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
                  {loaderData.locales.filter.region}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedRegions
                      .map((region) => {
                        return region.name;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.regions.map((area) => {
                    const isChecked =
                      fndFilterFieldset.regions.initialValue &&
                      Array.isArray(fndFilterFieldset.regions.initialValue)
                        ? fndFilterFieldset.regions.initialValue.includes(
                            area.slug
                          )
                        : fndFilterFieldset.regions.initialValue === area.slug;
                    return (
                      <FormControl
                        {...getInputProps(fndFilterFieldset.regions, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        defaultChecked={isChecked}
                        readOnly
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
                  {loaderData.locales.filter.eligibleEntity}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedEligibleEntities
                      .map((entity) => {
                        return entity.title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.eligibleEntities.map((entity) => {
                    const isChecked =
                      fndFilterFieldset.eligibleEntities.initialValue &&
                      Array.isArray(
                        fndFilterFieldset.eligibleEntities.initialValue
                      )
                        ? fndFilterFieldset.eligibleEntities.initialValue.includes(
                            entity.slug
                          )
                        : fndFilterFieldset.eligibleEntities.initialValue ===
                          entity.slug;
                    return (
                      <FormControl
                        {...getInputProps(fndFilterFieldset.eligibleEntities, {
                          type: "checkbox",
                          value: entity.slug,
                        })}
                        key={entity.slug}
                        defaultChecked={isChecked}
                        readOnly
                        disabled={entity.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>{entity.title}</FormControl.Label>
                        <FormControl.Counter>
                          {entity.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.Fieldset {...getFieldsetProps(fields.fndSortBy)}>
              <Dropdown orientation="right">
                <Dropdown.Label>
                  <span className="@lg:mv-hidden">
                    {loaderData.locales.filter.sortBy.label}
                    <br />
                  </span>
                  <span className="mv-font-normal @lg:mv-font-semibold">
                    {
                      loaderData.locales.filter.sortBy[
                        currentSortValue || FUNDING_SORT_VALUES[0]
                      ]
                    }
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {FUNDING_SORT_VALUES.map((sortValue) => {
                    return (
                      <FormControl
                        {...getInputProps(fields.fndSortBy, {
                          type: "radio",
                          value: sortValue,
                        })}
                        key={sortValue}
                        defaultChecked={currentSortValue === sortValue}
                      >
                        <FormControl.Label>
                          {loaderData.locales.filter.sortBy[sortValue]}
                        </FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.ResetButton form={resetForm.id}>
              {isHydrated
                ? loaderData.locales.filter.reset
                : loaderData.locales.filter.close}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {isHydrated
                ? decideBetweenSingularOrPlural(
                    insertParametersIntoLocale(
                      loaderData.locales.showNumberOfItems_singular,
                      {
                        count: loaderData.count,
                      }
                    ),
                    insertParametersIntoLocale(
                      loaderData.locales.showNumberOfItems_plural,
                      {
                        count: loaderData.count,
                      }
                    ),
                    loaderData.count
                  )
                : loaderData.locales.filter.apply}
            </Filters.ApplyButton>
          </Filters>
          <noscript className="mv-hidden @lg:mv-block mv-mt-2">
            <Button>{loaderData.locales.filter.apply}</Button>
          </noscript>
        </Form>
        <div
          className={
            loaderData.submission.value.showFilters === true
              ? "mv-hidden @lg:mv-block"
              : undefined
          }
        >
          <div className="mv-w-full mv-mx-auto @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl mv-mb-4">
            <hr className="mv-border-t mv-border-gray-200 mv-mt-4" />
          </div>
          <section className="mv-w-full mv-mx-auto @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6 mv-px-0">
            {(loaderData.selectedFundingTypes.length > 0 ||
              loaderData.selectedFundingAreas.length > 0 ||
              loaderData.selectedRegions.length > 0 ||
              loaderData.selectedEligibleEntities.length > 0) && (
              <div className="mv-flex mv-flex-col">
                <div className="mv-overflow-auto mv-flex mv-flex-nowrap @lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-4">
                  {loaderData.selectedFundingTypes.map((type) => {
                    const deleteSearchParams = new URLSearchParams(
                      searchParams
                    );
                    deleteSearchParams.delete(
                      fndFilterFieldset.types.name,
                      type.slug
                    );
                    return type.title !== null ? (
                      <ConformForm
                        key={type.slug}
                        useFormOptions={{
                          id: `delete-filter-${type.slug}`,
                          defaultValue: {
                            ...loaderData.submission.value,
                            fndFilter: {
                              ...loaderData.submission.value.fndFilter,
                              types:
                                loaderData.submission.value.fndFilter.types.filter(
                                  (currentType) => currentType !== type.slug
                                ),
                            },
                            search: [
                              loaderData.submission.value.search.join(" "),
                            ],
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
                          {type.title}
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
                  {loaderData.selectedFundingAreas.map((area) => {
                    const deleteSearchParams = new URLSearchParams(
                      searchParams
                    );
                    deleteSearchParams.delete(
                      fndFilterFieldset.areas.name,
                      area.slug
                    );
                    return area.title !== null ? (
                      <ConformForm
                        key={area.slug}
                        useFormOptions={{
                          id: `delete-filter-${area.slug}`,
                          defaultValue: {
                            ...loaderData.submission.value,
                            fndFilter: {
                              ...loaderData.submission.value.fndFilter,
                              areas:
                                loaderData.submission.value.fndFilter.areas.filter(
                                  (currentArea) => currentArea !== area.slug
                                ),
                            },
                            search: [
                              loaderData.submission.value.search.join(" "),
                            ],
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
                          {area.title}
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
                  {loaderData.selectedRegions.map((region) => {
                    const deleteSearchParams = new URLSearchParams(
                      searchParams
                    );
                    deleteSearchParams.delete(
                      fndFilterFieldset.regions.name,
                      region.slug
                    );
                    return region.name !== null ? (
                      <ConformForm
                        key={region.slug}
                        useFormOptions={{
                          id: `delete-filter-${region.slug}`,
                          defaultValue: {
                            ...loaderData.submission.value,
                            fndFilter: {
                              ...loaderData.submission.value.fndFilter,
                              regions:
                                loaderData.submission.value.fndFilter.regions.filter(
                                  (currentRegion) =>
                                    currentRegion !== region.slug
                                ),
                            },
                            search: [
                              loaderData.submission.value.search.join(" "),
                            ],
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
                          {region.name}
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
                  {loaderData.selectedEligibleEntities.map((entity) => {
                    const deleteSearchParams = new URLSearchParams(
                      searchParams
                    );
                    deleteSearchParams.delete(
                      fndFilterFieldset.eligibleEntities.name,
                      entity.slug
                    );
                    return entity.title !== null ? (
                      <ConformForm
                        key={entity.slug}
                        useFormOptions={{
                          id: `delete-filter-${entity.slug}`,
                          defaultValue: {
                            ...loaderData.submission.value,
                            fndFilter: {
                              ...loaderData.submission.value.fndFilter,
                              eligibleEntities:
                                loaderData.submission.value.fndFilter.eligibleEntities.filter(
                                  (currentEntity) =>
                                    currentEntity !== entity.slug
                                ),
                            },
                            search: [
                              loaderData.submission.value.search.join(" "),
                            ],
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
                          {entity.title}
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
                    {loaderData.locales.filter.reset}
                  </Button>
                </Form>
              </div>
            )}
          </section>
          {loaderData.count === 0 ? (
            <p className="mv-text-center mv-text-gray-700 mv-mb-4">
              {loaderData.locales.empty}
            </p>
          ) : null}

          <FundingCard.Container>
            {loaderData.fundings.map((funding) => {
              return (
                <FundingCard
                  key={funding.url}
                  url={funding.url}
                  locales={loaderData.locales}
                >
                  <FundingCard.Subtitle>
                    {funding.types
                      .map((relation) => {
                        return relation.type.title;
                      })
                      .join(", ")}
                  </FundingCard.Subtitle>
                  <FundingCard.Title as="h2">{funding.title}</FundingCard.Title>
                  <FundingCard.Category
                    items={funding.regions.map((relation) => {
                      return relation.area.name;
                    })}
                    locales={loaderData.locales}
                  >
                    <FundingCard.Category.Title>
                      {loaderData.locales.card.region}
                    </FundingCard.Category.Title>
                  </FundingCard.Category>
                  <FundingCard.Category
                    items={funding.sourceEntities}
                    locales={loaderData.locales}
                  >
                    <FundingCard.Category.Title>
                      {loaderData.locales.card.eligibleEntity}
                    </FundingCard.Category.Title>
                  </FundingCard.Category>

                  <FundingCard.Category
                    items={funding.sourceAreas}
                    locales={loaderData.locales}
                  >
                    <FundingCard.Category.Title>
                      {loaderData.locales.card.area}
                    </FundingCard.Category.Title>
                  </FundingCard.Category>
                </FundingCard>
              );
            })}
          </FundingCard.Container>

          {loaderData.count > loaderData.fundings.length && (
            <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 @md:mv-mb-24 @lg:mv-mb-8 mv-mt-4 @lg:mv-mt-8">
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
                  {loaderData.locales.more}
                </Button>
              </Form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
