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

const getFundingsSchema = z.object({
  filter: z
    .object({
      funders: z.array(z.string()),
      types: z.array(z.string()),
      areas: z.array(z.string()),
      regions: z.array(z.string()),
      eligibleEntities: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (filter === undefined) {
        return {
          funders: [],
          types: [],
          areas: [],
          regions: [],
          eligibleEntities: [],
        };
      }
      return filter;
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

type GetFundingsSchema = z.infer<typeof getFundingsSchema>;

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
    const typedKey = key as keyof GetFundingsSchema["filter"];

    let singularKey;
    let pluralKey;
    if (
      typedKey === "funders" ||
      typedKey === "types" ||
      typedKey === "areas"
    ) {
      singularKey = typedKey.slice(0, -1);
      pluralKey = typedKey;
    } else if (typedKey === "regions") {
      singularKey = "area";
      pluralKey = typedKey;
    } else if (typedKey === "eligibleEntities") {
      singularKey = "entity";
      pluralKey = "eligibleEntities";
    } else {
      throw new Error("Invalid key");
    }

    const values = submission.value.filter[typedKey];
    if (values.length === 0) {
      continue;
    }
    for (const value of values) {
      const whereStatement = {
        [pluralKey]: {
          some: {
            [singularKey]: {
              slug: value,
            },
          },
        },
      };
      whereClauses.push(whereStatement);
    }
  }

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
  });

  const count = await prismaClient.funding.count({
    where: {
      AND: whereClauses,
    },
  });

  const funders = await prismaClient.funder.findMany({
    select: {
      slug: true,
      title: true,
    },
  });
  const enhancedFunders = funders.map((funder) => {
    const isChecked = submission.value.filter.funders.includes(funder.slug);
    return {
      ...funder,
      isChecked,
    };
  });

  const selectedFunders = submission.value.filter.funders.map((slug) => {
    const funderMatch = funders.find((funder) => funder.slug === slug);
    return {
      slug,
      title: funderMatch?.title || null,
    };
  });
  const fundingTypes = await prismaClient.fundingType.findMany({
    select: {
      slug: true,
      title: true,
    },
  });
  const enhancedFundingTypes = fundingTypes.map((type) => {
    const isChecked = submission.value.filter.types.includes(type.slug);
    return {
      ...type,
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
    const isChecked = submission.value.filter.areas.includes(area.slug);
    return {
      ...area,
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
    const isChecked = submission.value.filter.eligibleEntities.includes(
      entity.slug
    );
    return {
      ...entity,
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
    const isChecked = submission.value.filter.regions.includes(region.slug);
    return {
      ...region,
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
    funders: enhancedFunders,
    selectedFunders,
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

function Fundings() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const [form, fields] = useForm<GetFundingsSchema>({
    lastResult: loaderData.submission,
  });

  const navigation = useNavigation();
  const location = useLocation();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${loaderData.submission.value.page + 1}`);

  const filter = fields.filter.getFieldset();

  return (
    <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-flex mv-flex-col mv-gap-4">
      <div>
        <Form
          {...getFormProps(form)}
          method="get"
          onChange={(event) => {
            submit(event.currentTarget, { preventScrollReset: true });
          }}
        >
          <input name="page" defaultValue="1" hidden />
          <ShowFiltersButton
            {...getInputProps(fields.showFilters, {
              type: "checkbox",
              value: loaderData.submission.value.showFilters === true,
            })}
          >
            Filter anzeigen
          </ShowFiltersButton>
          <Filters showFilters={loaderData.submission.value.showFilters}>
            <Filters.Title>Filter</Filters.Title>
            <Filters.Fieldset
              className="mv-flex mv-flex-wrap @lg:mv-gap-4"
              {...getFieldsetProps(fields.filter)}
              showMore="Mehr anzeigen"
              showLess="Weniger anzeigen"
            >
              <Dropdown>
                <Dropdown.Label>
                  Fördererart
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.fundingTypes
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
                      >
                        <FormControl.Label>{type.title}</FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  Förderbereich
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.fundingAreas
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
                      >
                        <FormControl.Label>{area.title}</FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  Förderregion
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.regions
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
                      >
                        <FormControl.Label>{area.name}</FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  Förderberechtigte
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.eligibleEntities
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
                        checked={loaderData.submission.value.filter.regions.includes(
                          entity.slug
                        )}
                        readOnly
                      >
                        <FormControl.Label>{entity.title}</FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.ResetButton to={`${location.pathname}`}>
              Filter zurücksetzen
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {loaderData.count} Förderungen anzeigen
            </Filters.ApplyButton>
          </Filters>
        </Form>
      </div>
      <section className="mv-w-full mv-mx-auto @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6 mv-px-0">
        {(loaderData.selectedFunders.length > 0 ||
          loaderData.selectedFundingTypes.length > 0 ||
          loaderData.selectedFundingAreas.length > 0 ||
          loaderData.selectedRegions.length > 0 ||
          loaderData.selectedEligibleEntities.length > 0) && (
          <div className="mv-flex mv-flex-col">
            <div className="mv-overflow-scroll @lg:mv-overflow-auto mv-flex mv-flex-nowrap @lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-4">
              {loaderData.selectedFunders.map((funder) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(filter.funders.name, funder.slug);
                return funder.title !== null ? (
                  <Chip key={funder.slug} size="medium">
                    {funder.title}
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
      <p>{loaderData.count} Förderungen gefunden!</p>

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
                  Fördergebiet
                </FundingCard.Category.Title>
              </FundingCard.Category>
              <FundingCard.Category items={funding.sourceEntities}>
                <FundingCard.Category.Title>
                  Wer wird gefördert?
                </FundingCard.Category.Title>
              </FundingCard.Category>

              <FundingCard.Category items={funding.sourceAreas}>
                <FundingCard.Category.Title>
                  Was wird gefördert?
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
              Mehr
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default Fundings;
