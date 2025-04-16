import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { redirect, type LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { z } from "zod";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { Dropdown } from "~/components-next/Dropdown";
import { Filters, ShowFiltersButton } from "~/components-next/Filters";
import { FormControl } from "~/components-next/FormControl";
import { FundingCard } from "~/components-next/FundingCard";
import {
  getAllFundings,
  getFilterCountForSlug,
  getFundingFilterVectorForAttribute,
  getFundingIds,
  getTakeParam,
} from "./fundings.server";
import { H1 } from "~/components/Heading/Heading";
import { detectLanguage } from "~/root.server";
import {
  decideBetweenSingularOrPlural,
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";
import { type FilterSchemes, getFilterSchemes } from "./index";
import { createAuthClient, getSessionUser } from "~/auth.server";

const sortValues = ["createdAt-desc", "title-asc", "title-desc"] as const;

export const getFundingsSchema = z.object({
  fndFilter: z
    .object({
      types: z.array(z.string()),
      areas: z.array(z.string()),
      regions: z.array(z.string()),
      eligibleEntities: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (typeof filter === "undefined") {
        return {
          types: [],
          areas: [],
          regions: [],
          eligibleEntities: [],
        };
      }
      return filter;
    }),
  fndSortBy: z
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
  fndPage: z
    .number()
    .optional()
    .transform((page) => {
      if (page === undefined) {
        return 1;
      }
      return page;
    }),
  showFilters: z.boolean().optional(),
});

export type GetFundingsSchema = z.infer<typeof getFundingsSchema>;

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
  const typeFilterVector = await getFundingFilterVectorForAttribute({
    attribute: "types",
    filter: submission.value.fndFilter,
    search: submission.value.search,
    ids: fundingIds,
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
      const isChecked = submission.value.fndFilter.types.includes(type.slug);
      return {
        ...type,
        vectorCount,
        isChecked,
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
  const areaFilterVector = await getFundingFilterVectorForAttribute({
    attribute: "areas",
    filter: submission.value.fndFilter,
    search: submission.value.search,
    ids: fundingIds,
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
      const isChecked = submission.value.fndFilter.areas.includes(area.slug);
      return {
        ...area,
        vectorCount,
        isChecked,
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
  const eligibleEntitiesFilterVector = await getFundingFilterVectorForAttribute(
    {
      attribute: "eligibleEntities",
      filter: submission.value.fndFilter,
      search: submission.value.search,
      ids: fundingIds,
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
      const isChecked = submission.value.fndFilter.eligibleEntities.includes(
        entity.slug
      );
      return {
        ...entity,
        vectorCount,
        isChecked,
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
  const regionFilterVector = await getFundingFilterVectorForAttribute({
    attribute: "regions",
    filter: submission.value.fndFilter,
    search: submission.value.search,
    ids: fundingIds,
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
      const isChecked = submission.value.fndFilter.regions.includes(
        region.slug
      );
      return {
        ...region,
        vectorCount,
        isChecked,
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

function Fundings() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const [form, fields] = useForm<FilterSchemes>({});

  const navigation = useNavigation();
  const location = useLocation();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set(
    "fndPage",
    `${loaderData.submission.value.fndPage + 1}`
  );

  const filter = fields.fndFilter.getFieldset();

  const currentSortValue = sortValues.find((value) => {
    return (
      value ===
      `${loaderData.submission.value.fndSortBy.value}-${loaderData.submission.value.fndSortBy.direction}`
    );
  });

  const additionalSearchParams: { key: string; value: string }[] = [];
  const schemaKeys = getFundingsSchema.keyof().options as string[];
  searchParams.forEach((value, key) => {
    const isIncluded = schemaKeys.some((schemaKey) => {
      return schemaKey === key || key.startsWith(`${schemaKey}.`);
    });
    if (isIncluded === false) {
      additionalSearchParams.push({ key, value });
    }
  });

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-12 mv-mt-5 @md:mv-mt-7 @lg:mv-mt-8 mv-text-center">
        <div className="mv-flex mv-flex-col mv-justify-center mv-gap-8">
          <div>
            <span className="mv-text-white mv-text-xs mv-py-[2px] mv-px-[5px] mv-bg-secondary mv-rounded mv-leading-none mv-h-[18px] mv-font-semibold">
              BETA
            </span>
            <H1 className="mv-mb-4 @md:mv-mb-2 @lg:mv-mb-3" like="h0">
              {loaderData.locales.title}
            </H1>
            <p>{loaderData.locales.intro}</p>
            <p>
              {insertComponentsIntoLocale(
                insertParametersIntoLocale(loaderData.locales.databaseList, {
                  0: "https://www.foerderdatenbank.de",
                  1: "https://foerder-finder.de",
                  2: "https://sigu-plattform.de/foerderfinder/",
                  3: "https://foerderdatenbank.d-s-e-e.de/",
                }),
                [
                  <Link
                    key="foerderdatenbank"
                    to="https://www.foerderdatenbank.de"
                    rel="noopener noreferrer"
                    target="_blank"
                    className="mv-font-semibold hover:mv-underline"
                  >
                    {" "}
                  </Link>,
                  <Link
                    key="foerder-finder"
                    to="https://foerder-finder.de"
                    rel="noopener noreferrer"
                    target="_blank"
                    className="mv-font-semibold hover:mv-underline"
                  >
                    {" "}
                  </Link>,
                  <Link
                    key="sigu-plattform"
                    to="https://sigu-plattform.de/foerderfinder/"
                    rel="noopener noreferrer"
                    target="_blank"
                    className="mv-font-semibold hover:mv-underline"
                  >
                    {" "}
                  </Link>,
                  <Link
                    key="foerderdatenbank-d-s-e-e"
                    to="https://foerderdatenbank.d-s-e-e.de/"
                    rel="noopener noreferrer"
                    target="_blank"
                    className="mv-font-semibold hover:mv-underline"
                  >
                    {" "}
                  </Link>,
                ]
              )}
            </p>
            <p>{loaderData.locales.intro2}</p>
          </div>
          <div className="mv-p-4 @lg:mv-pr-12 mv-bg-primary-50 mv-rounded-lg mv-text-left mv-flex mv-flex-col mv-gap-2.5">
            <p className="mv-font-bold">{loaderData.locales.survey.title}</p>
            <p>
              {insertComponentsIntoLocale(
                loaderData.locales.survey.description,
                {
                  link1: (
                    <Link
                      to="mailto:community@mint-vernetzt.de"
                      className="mv-font-semibold hover:mv-underline"
                    >
                      {" "}
                    </Link>
                  ),
                }
              )}
            </p>
          </div>
        </div>
      </section>
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
          <input name="fndPage" defaultValue="1" hidden />
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
                    return (
                      <FormControl
                        {...getInputProps(filter.types, {
                          type: "checkbox",
                          value: type.slug,
                        })}
                        key={type.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={type.isChecked}
                        readOnly
                        disabled={type.vectorCount === 0 && !type.isChecked}
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
                    return (
                      <FormControl
                        {...getInputProps(filter.areas, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={loaderData.submission.value.fndFilter.areas.includes(
                          area.slug
                        )}
                        readOnly
                        disabled={area.vectorCount === 0 && !area.isChecked}
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
                    return (
                      <FormControl
                        {...getInputProps(filter.regions, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={loaderData.submission.value.fndFilter.regions.includes(
                          area.slug
                        )}
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
                    return (
                      <FormControl
                        {...getInputProps(filter.eligibleEntities, {
                          type: "checkbox",
                          value: entity.slug,
                        })}
                        key={entity.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={loaderData.submission.value.fndFilter.eligibleEntities.includes(
                          entity.slug
                        )}
                        readOnly
                        disabled={entity.vectorCount === 0 && !entity.isChecked}
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
                        currentSortValue || sortValues[0]
                      ]
                    }
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {sortValues.map((sortValue) => {
                    return (
                      <FormControl
                        {...getInputProps(fields.fndSortBy, {
                          type: "radio",
                          value: sortValue,
                        })}
                        key={sortValue}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={currentSortValue === sortValue}
                        readOnly
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
            <Filters.ResetButton to={`${location.pathname}`}>
              {loaderData.locales.filter.reset}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {decideBetweenSingularOrPlural(
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
              )}
            </Filters.ApplyButton>
          </Filters>
          <noscript>
            <Button>{loaderData.locales.filter.apply}</Button>
          </noscript>
        </Form>
        <div className="mv-w-full mv-mx-auto @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl mv-mb-4">
          <hr className="mv-border-t mv-border-gray-200 mv-mt-4" />
        </div>
        <section className="mv-w-full mv-mx-auto @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6 mv-px-0">
          {(loaderData.selectedFundingTypes.length > 0 ||
            loaderData.selectedFundingAreas.length > 0 ||
            loaderData.selectedRegions.length > 0 ||
            loaderData.selectedEligibleEntities.length > 0) && (
            <div className="mv-flex mv-flex-col">
              <div className="mv-overflow-scroll @lg:mv-overflow-auto mv-flex mv-flex-nowrap @lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-4">
                {loaderData.selectedFundingTypes.map((type) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(filter.types.name, type.slug);
                  return type.title !== null ? (
                    <Chip key={type.slug} size="medium">
                      {type.title}
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
                {loaderData.selectedFundingAreas.map((area) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(filter.areas.name, area.slug);
                  return area.title !== null ? (
                    <Chip key={area.slug} size="medium">
                      {area.title}
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
                {loaderData.selectedRegions.map((region) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(filter.regions.name, region.slug);
                  return region.name !== null ? (
                    <Chip key={region.slug} size="medium">
                      {region.name}
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
                {loaderData.selectedEligibleEntities.map((entity) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(
                    filter.eligibleEntities.name,
                    entity.slug
                  );
                  return entity.title !== null ? (
                    <Chip key={entity.slug} size="medium">
                      {entity.title}
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
              </div>
              <Link
                className="mv-w-fit"
                to={`${location.pathname}`}
                preventScrollReset
              >
                <Button
                  variant="outline"
                  loading={navigation.state === "loading"}
                  disabled={navigation.state === "loading"}
                >
                  Filter zurücksetzen
                </Button>
              </Link>
            </div>
          )}
        </section>
        {loaderData.count > 0 ? (
          <p className="text-center text-gray-700 mb-4">
            <strong>{loaderData.count}</strong>{" "}
            {decideBetweenSingularOrPlural(
              loaderData.locales.itemsCountSuffix_one,
              loaderData.locales.itemsCountSuffix_other,
              loaderData.count
            )}
          </p>
        ) : (
          <p className="text-center text-gray-700 mb-4">
            {loaderData.locales.empty}
          </p>
        )}

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
                <FundingCard.Title>{funding.title}</FundingCard.Title>
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
                {loaderData.locales.more}
              </Button>
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

export default Fundings;
