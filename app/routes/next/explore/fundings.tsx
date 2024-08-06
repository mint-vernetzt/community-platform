import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { parseWithZod } from "@conform-to/zod-v1";
import { Button, Chip } from "@mint-vernetzt/components";
import { type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { z } from "zod";
import { createAuthClient } from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import {
  Dropdown,
  Filters,
  FormControl,
  ShowFiltersButton,
} from "../../explore/__components";
import FundingCard from "./__components";
import {
  getFilterCountForSlug,
  getFundingFilterVector,
  getKeys,
} from "./fundings.server";
import { useTranslation } from "react-i18next";
import { H1 } from "~/components/Heading/Heading";

const sortValues = ["title-asc", "title-desc", "createdAt-desc"] as const;

const getFundingsSchema = z.object({
  filter: z
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
  showFilters: z.boolean().optional(),
});

export type GetFundingsSchema = z.infer<typeof getFundingsSchema>;
export type FilterKey = keyof GetFundingsSchema["filter"];

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const abilities = await getFeatureAbilities(authClient, "fundings");

  if (abilities.fundings.hasAccess === false) {
    return redirect("/");
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const submission = parseWithZod(searchParams, {
    schema: getFundingsSchema,
  });

  invariantResponse(submission.status === "success", "???");

  const take = submission.value.page * 12;

  const whereClauses = [];
  for (const key in submission.value.filter) {
    const typedKey = key as FilterKey;

    const { singularKey, pluralKey } = getKeys(typedKey);

    const values = submission.value.filter[typedKey];
    if (values.length === 0) {
      continue;
    }
    for (const value of values) {
      const whereStatement = {
        [pluralKey]: {
          some: {
            [typedKey === "regions" ? "area" : singularKey]: {
              // funding data for areas is stored in regions
              slug: value,
            },
          },
        },
      };
      whereClauses.push(whereStatement);
    }
  }

  const sortBy = submission.value.sortBy;

  const fundings = await prismaClient.funding.findMany({
    select: {
      title: true,
      url: true,
      funders: {
        select: {
          funder: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      types: {
        select: {
          type: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      areas: {
        select: {
          area: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      eligibleEntities: {
        select: {
          entity: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      regions: {
        select: {
          area: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
      sourceEntities: true,
      sourceAreas: true,
    },
    where: {
      AND: whereClauses,
    },
    take: take,
    orderBy: [
      {
        [sortBy.value]: sortBy.direction,
      },
      {
        id: "asc",
      },
    ],
  });

  const count = await prismaClient.funding.count({
    where: {
      AND: whereClauses,
    },
  });

  const filterVector = await getFundingFilterVector({
    filter: submission.value.filter,
  });

  const fundingTypes = await prismaClient.fundingType.findMany({
    select: {
      slug: true,
      title: true,
    },
  });
  const enhancedFundingTypes = fundingTypes.map((type) => {
    const vectorCount = getFilterCountForSlug(type.slug, filterVector, "types");
    const isChecked = submission.value.filter.types.includes(type.slug);
    return {
      ...type,
      vectorCount,
      isChecked,
    };
  });
  const selectedFundingTypes = submission.value.filter.types.map((slug) => {
    const fundingTypeMatch = fundingTypes.find((type) => type.slug === slug);
    return {
      slug,
      title: fundingTypeMatch?.title || null,
    };
  });
  const fundingAreas = await prismaClient.fundingArea.findMany({
    select: {
      slug: true,
      title: true,
    },
  });
  const enhancedFundingAreas = fundingAreas.map((area) => {
    const vectorCount = getFilterCountForSlug(area.slug, filterVector, "areas");
    const isChecked = submission.value.filter.areas.includes(area.slug);
    return {
      ...area,
      vectorCount,
      isChecked,
    };
  });
  const selectedFundingAreas = submission.value.filter.areas.map((slug) => {
    const fundingAreaMatch = fundingAreas.find((area) => area.slug === slug);
    return {
      slug,
      title: fundingAreaMatch?.title || null,
    };
  });
  const eligibleEntities = await prismaClient.fundingEligibleEntity.findMany({
    select: {
      slug: true,
      title: true,
    },
  });
  const enhancedEligibleEntities = eligibleEntities.map((entity) => {
    const vectorCount = getFilterCountForSlug(
      entity.slug,
      filterVector,
      "eligibleEntities"
    );
    const isChecked = submission.value.filter.eligibleEntities.includes(
      entity.slug
    );
    return {
      ...entity,
      vectorCount,
      isChecked,
    };
  });
  const selectedEligibleEntities = submission.value.filter.eligibleEntities.map(
    (slug) => {
      const entityMatch = eligibleEntities.find(
        (entity) => entity.slug === slug
      );
      return {
        slug,
        title: entityMatch?.title || null,
      };
    }
  );
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
  });
  const enhancedRegions = regions.map((region) => {
    const vectorCount = getFilterCountForSlug(
      region.slug,
      filterVector,
      "regions"
    );
    const isChecked = submission.value.filter.regions.includes(region.slug);
    return {
      ...region,
      vectorCount,
      isChecked,
    };
  });
  const selectedRegions = submission.value.filter.regions.map((slug) => {
    const regionMatch = regions.find((region) => region.slug === slug);
    return {
      slug,
      name: regionMatch?.name || null,
    };
  });

  return json({
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
  } as const);
}

const i18nNS = ["routes/next/explore/fundings"];
export const handle = {
  i18n: i18nNS,
};

function Fundings() {
  const { t } = useTranslation(i18nNS);

  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const [form, fields] = useForm<GetFundingsSchema>({});

  const navigation = useNavigation();
  const location = useLocation();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${loaderData.submission.value.page + 1}`);

  const filter = fields.filter.getFieldset();

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-12 mv-mt-5 @md:mv-mt-7 @lg:mv-mt-8 mv-text-center">
        <H1 className="mv-mb-4 @md:mv-mb-2 @lg:mv-mb-3" like="h0">
          {t("title")}
        </H1>
        <p>{t("intro")}</p>
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
          <input name="page" defaultValue="1" hidden />
          <ShowFiltersButton>{t("showFiltersLabel")}</ShowFiltersButton>
          <Filters
            showFilters={searchParams.get(fields.showFilters.name) === "on"}
          >
            <Filters.Title>Filter</Filters.Title>
            <Filters.Fieldset
              className="mv-flex mv-flex-wrap @lg:mv-gap-4"
              {...getFieldsetProps(fields.filter)}
              showMore={t("filter.showMore")}
              showLess={t("filter.showLess")}
            >
              <Dropdown>
                <Dropdown.Label>
                  {t("filter.type")}
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
                  {t("filter.area")}
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
                        checked={loaderData.submission.value.filter.areas.includes(
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
                  {t("filter.region")}
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
                        checked={loaderData.submission.value.filter.regions.includes(
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
                  {t("filter.eligibleEntity")}
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
                        checked={loaderData.submission.value.filter.eligibleEntities.includes(
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
            <Filters.Fieldset {...getFieldsetProps(fields.sortBy)}>
              <Dropdown orientation="right">
                <Dropdown.Label>
                  <span className="@lg:mv-hidden">
                    {t("filter.sortBy.label")}
                    <br />
                  </span>
                  <span className="mv-font-normal @lg:mv-font-semibold">
                    {t(
                      `filter.sortBy.${loaderData.submission.value.sortBy.value}-${loaderData.submission.value.sortBy.direction}`
                    )}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {sortValues.map((sortValue) => {
                    const submissionSortValue = `${loaderData.submission.value.sortBy.value}-${loaderData.submission.value.sortBy.direction}`;
                    return (
                      <FormControl
                        {...getInputProps(fields.sortBy, {
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
                          {t(`filter.sortBy.${sortValue}`)}
                        </FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.ResetButton to={`${location.pathname}`}>
              {t("filter.reset")}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {t("showNumberOfItems", {
                count: loaderData.count,
              })}
            </Filters.ApplyButton>
          </Filters>
          <noscript>
            <Button>{t("filter.apply")}</Button>
          </noscript>
        </Form>
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
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
            {t("itemsCountSuffix", { count: loaderData.count })}
          </p>
        ) : (
          <p className="text-center text-gray-700 mb-4">{t("empty")}</p>
        )}

        <FundingCard.Container>
          {loaderData.fundings.map((funding) => {
            return (
              <FundingCard key={funding.url} url={funding.url}>
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
                >
                  <FundingCard.Category.Title>
                    {t("card.region")}
                  </FundingCard.Category.Title>
                </FundingCard.Category>
                <FundingCard.Category items={funding.sourceEntities}>
                  <FundingCard.Category.Title>
                    {t("card.eligibleEntity")}
                  </FundingCard.Category.Title>
                </FundingCard.Category>

                <FundingCard.Category items={funding.sourceAreas}>
                  <FundingCard.Category.Title>
                    {t("card.area")}
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
                {t("more")}
              </Button>
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

export default Fundings;
