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
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
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
import { H1 } from "~/components/Heading/Heading";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { Dropdown } from "~/components-next/Dropdown";
import { Filters, ShowFiltersButton } from "~/components-next/Filters";
import { FormControl } from "~/components-next/FormControl";
import {
  getAllFocuses,
  getAllOrganizationTypes,
  getAllOrganizations,
  getFilterCountForSlug,
  getOrganizationFilterVectorForAttribute,
  getOrganizationIds,
  getTakeParam,
} from "./organizations.server";
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

const sortValues = ["name-asc", "name-desc", "createdAt-desc"] as const;

export type GetOrganizationsSchema = z.infer<typeof getOrganizationsSchema>;

export const getOrganizationsSchema = z.object({
  orgFilter: z
    .object({
      type: z.array(z.string()),
      focus: z.array(z.string()),
      area: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (filter === undefined) {
        return {
          type: [],
          focus: [],
          area: [],
        };
      }
      return filter;
    }),
  orgSortBy: z
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
  orgPage: z
    .number()
    .optional()
    .transform((page) => {
      if (page === undefined) {
        return 1;
      }
      return page;
    }),
  orgAreaSearch: z
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
  const locales = languageModuleMap[language]["explore/organizations"];

  const take = getTakeParam(submission.value.orgPage);
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let filteredByVisibilityCount;
  if (!isLoggedIn) {
    const organizationIdsFilteredByVisibility = await getOrganizationIds({
      filter: submission.value.orgFilter,
      search: submission.value.search,
      isLoggedIn,
      language,
    });
    filteredByVisibilityCount = organizationIdsFilteredByVisibility.length;
  }

  const organizationIds = await getOrganizationIds({
    filter: submission.value.orgFilter,
    search: submission.value.search,
    isLoggedIn: true,
    language,
  });

  const organizationCount = organizationIds.length;

  const organizations = await getAllOrganizations({
    filter: submission.value.orgFilter,
    sortBy: submission.value.orgSortBy,
    search: submission.value.search,
    sessionUser,
    take,
    language,
  });

  const enhancedOrganizations = [];
  for (const organization of organizations) {
    let enhancedOrganization = {
      ...organization,
    };

    if (!isLoggedIn) {
      // Filter organization
      type EnhancedOrganization = typeof enhancedOrganization;
      enhancedOrganization =
        filterOrganizationByVisibility<EnhancedOrganization>(
          enhancedOrganization
        );
      // Filter team members
      enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
        (relation) => {
          type ProfileRelation = typeof relation.profile;
          const filteredProfile = filterProfileByVisibility<ProfileRelation>(
            relation.profile
          );
          return { ...relation, profile: { ...filteredProfile } };
        }
      );
    }

    // Add images from image proxy
    let logo = enhancedOrganization.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.Card.Logo.width,
            height: ImageSizes.Organization.Card.Logo.height,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.Card.BlurredLogo.width,
            height: ImageSizes.Organization.Card.BlurredLogo.height,
          },
          blur: BlurFactor,
        });
      }
    }

    let background = enhancedOrganization.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.Card.Background.width,
            height: ImageSizes.Organization.Card.Background.height,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.Card.BlurredBackground.width,
            height: ImageSizes.Organization.Card.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Organization.Background;
      blurredBackground = DefaultImages.Organization.BlurredBackground;
    }

    const teamMembers = enhancedOrganization.teamMembers.map((relation) => {
      let avatar = relation.profile.avatar;
      let blurredAvatar;
      if (avatar !== null) {
        const publicURL = getPublicURL(authClient, avatar);
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.CardFooter.Avatar.width,
            height: ImageSizes.Profile.CardFooter.Avatar.height,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.CardFooter.BlurredAvatar.width,
            height: ImageSizes.Profile.CardFooter.BlurredAvatar.height,
          },
          blur: BlurFactor,
        });
      }
      return {
        ...relation,
        profile: { ...relation.profile, avatar, blurredAvatar },
      };
    });

    const imageEnhancedOrganization = {
      ...enhancedOrganization,
      logo,
      blurredLogo,
      background,
      blurredBackground,
      teamMembers,
    };

    const transformedOrganization = {
      ...imageEnhancedOrganization,
      teamMembers: imageEnhancedOrganization.teamMembers.map((relation) => {
        return relation.profile;
      }),
      types: imageEnhancedOrganization.types.map((relation) => {
        return relation.organizationType.slug;
      }),
      networkTypes: imageEnhancedOrganization.networkTypes.map((relation) => {
        return relation.networkType.slug;
      }),
      focuses: imageEnhancedOrganization.focuses.map((relation) => {
        return relation.focus.slug;
      }),
      areas: imageEnhancedOrganization.areas.map((relation) => {
        return relation.area.name;
      }),
    };

    enhancedOrganizations.push(transformedOrganization);
  }

  const areas = await getAreasBySearchQuery(submission.value.orgAreaSearch);
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
  const areaFilterVector = await getOrganizationFilterVectorForAttribute({
    attribute: "area",
    filter: submission.value.orgFilter,
    search: submission.value.search,
    ids: organizationIds,
  });
  for (const area of areas) {
    const vectorCount = getFilterCountForSlug(
      area.slug,
      areaFilterVector,
      "area"
    );
    const isChecked = submission.value.orgFilter.area.includes(area.slug);
    const enhancedArea = {
      ...area,
      vectorCount,
      isChecked,
    };
    enhancedAreas[area.type].push(enhancedArea);
  }
  const selectedAreas = await Promise.all(
    submission.value.orgFilter.area.map(async (slug) => {
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

  const types = await getAllOrganizationTypes();
  const typeFilterVector = await getOrganizationFilterVectorForAttribute({
    attribute: "type",
    filter: submission.value.orgFilter,
    search: submission.value.search,
    ids: organizationIds,
  });
  const enhancedTypes = types.map((type) => {
    const vectorCount = getFilterCountForSlug(
      type.slug,
      typeFilterVector,
      "type"
    );
    const isChecked = submission.value.orgFilter.type.includes(type.slug);
    return { ...type, vectorCount, isChecked };
  });

  const focuses = await getAllFocuses();
  const focusFilterVector = await getOrganizationFilterVectorForAttribute({
    attribute: "focus",
    filter: submission.value.orgFilter,
    search: submission.value.search,
    ids: organizationIds,
  });
  const enhancedFocuses = focuses.map((focus) => {
    const vectorCount = getFilterCountForSlug(
      focus.slug,
      focusFilterVector,
      "focus"
    );
    const isChecked = submission.value.orgFilter.focus.includes(focus.slug);
    return { ...focus, vectorCount, isChecked };
  });

  return {
    isLoggedIn,
    organizations: enhancedOrganizations,
    areas: enhancedAreas,
    selectedAreas,
    focuses: enhancedFocuses,
    selectedFocuses: submission.value.orgFilter.focus,
    types: enhancedTypes,
    selectedTypes: submission.value.orgFilter.type,
    submission,
    filteredByVisibilityCount,
    organizationsCount: organizationCount,
    locales,
  };
};

export default function ExploreOrganizations() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const location = useLocation();
  const submit = useSubmit();
  const debounceSubmit = useDebounceSubmit();

  const [form, fields] = useForm<FilterSchemes>({});

  const filter = fields.orgFilter.getFieldset();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set(
    "orgPage",
    `${loaderData.submission.value.orgPage + 1}`
  );

  const [searchQuery, setSearchQuery] = useState(
    loaderData.submission.value.orgAreaSearch
  );

  const additionalSearchParams: { key: string; value: string }[] = [];
  const schemaKeys = getOrganizationsSchema.keyof().options as string[];
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
      loaderData.filteredByVisibilityCount > loaderData.organizations.length;
  } else {
    showMore = loaderData.organizationsCount > loaderData.organizations.length;
  }

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-12 mv-mt-5 @md:mv-mt-7 @lg:mv-mt-8 mv-text-center">
        <H1 className="mv-mb-4 @md:mv-mb-2 @lg:mv-mb-3" like="h0">
          {locales.route.title}
        </H1>
        <p>{locales.route.intro}</p>
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
          <input name="orgPage" defaultValue="1" hidden />
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
              {...getFieldsetProps(fields.orgFilter)}
              className="mv-flex mv-flex-wrap @lg:mv-gap-4"
            >
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.types}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedTypes
                      .map((type) => {
                        let title;
                        if (type in locales.organizationTypes) {
                          type LocaleKey =
                            keyof typeof locales.organizationTypes;
                          title =
                            locales.organizationTypes[type as LocaleKey].title;
                        } else {
                          console.error(
                            `Organization type ${type} not found in locales`
                          );
                          title = type;
                        }
                        return title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.types.map((type) => {
                    return (
                      <FormControl
                        {...getInputProps(filter.type, {
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
                        <FormControl.Label>
                          {(() => {
                            let title;
                            let description;
                            if (type.slug in locales.organizationTypes) {
                              type LocaleKey =
                                keyof typeof locales.organizationTypes;
                              title =
                                locales.organizationTypes[
                                  type.slug as LocaleKey
                                ].title;
                              description =
                                locales.organizationTypes[
                                  type.slug as LocaleKey
                                ].description;
                            } else {
                              console.error(
                                `Organization type ${type.slug} not found in locales`
                              );
                              title = type.slug;
                              description = null;
                            }
                            return (
                              <>
                                {title}
                                {description !== null ? (
                                  <p className="mv-text-sm">{description}</p>
                                ) : null}
                              </>
                            );
                          })()}
                        </FormControl.Label>
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
                  {locales.route.filter.focuses}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedFocuses
                      .map((focus) => {
                        let title;
                        if (focus in locales.focuses) {
                          type LocaleKey = keyof typeof locales.focuses;
                          title = locales.focuses[focus as LocaleKey].title;
                        } else {
                          console.error(`Focus ${focus} not found in locales`);
                          title = focus;
                        }
                        return title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.focuses.map((focus) => {
                    return (
                      <FormControl
                        {...getInputProps(filter.focus, {
                          type: "checkbox",
                          value: focus.slug,
                        })}
                        key={focus.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={focus.isChecked}
                        readOnly
                        disabled={focus.vectorCount === 0 && !focus.isChecked}
                      >
                        <FormControl.Label>
                          {(() => {
                            let title;
                            let description;
                            if (focus.slug in locales.focuses) {
                              type LocaleKey = keyof typeof locales.focuses;
                              title =
                                locales.focuses[focus.slug as LocaleKey].title;
                              description =
                                locales.focuses[focus.slug as LocaleKey]
                                  .description;
                            } else {
                              console.error(
                                `Focus ${focus.slug} not found in locales`
                              );
                              title = focus.slug;
                              description = null;
                            }
                            return (
                              <>
                                {title}
                                {description !== null ? (
                                  <p className="mv-text-sm">{description}</p>
                                ) : null}
                              </>
                            );
                          })()}
                        </FormControl.Label>
                        <FormControl.Counter>
                          {focus.vectorCount}
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
                      id={fields.orgAreaSearch.id}
                      name={fields.orgAreaSearch.name}
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
                      <Input.Label htmlFor={fields.orgAreaSearch.id} hidden>
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
            </Filters.Fieldset>
            <Filters.Fieldset {...getFieldsetProps(fields.orgSortBy)}>
              <Dropdown orientation="right">
                <Dropdown.Label>
                  <span className="@lg:mv-hidden">
                    {locales.route.filter.sortBy.label}
                    <br />
                  </span>
                  <span className="mv-font-normal @lg:mv-font-semibold">
                    {(() => {
                      const currentValue = `${loaderData.submission.value.orgSortBy.value}-${loaderData.submission.value.orgSortBy.direction}`;
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
                  {sortValues.map((sortValue) => {
                    const submissionSortValue = `${loaderData.submission.value.orgSortBy.value}-${loaderData.submission.value.orgSortBy.direction}`;
                    return (
                      <FormControl
                        {...getInputProps(fields.orgSortBy, {
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
                loaderData.submission.value.orgSortBy !== undefined
                  ? `?orgSortBy=${loaderData.submission.value.orgSortBy.value}-${loaderData.submission.value.orgSortBy.direction}`
                  : ""
              }`}
            >
              {locales.route.filter.reset}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {decideBetweenSingularOrPlural(
                insertParametersIntoLocale(
                  locales.route.showNumberOfItems_one,
                  { count: loaderData.organizationsCount }
                ),
                insertParametersIntoLocale(
                  locales.route.showNumberOfItems_other,
                  { count: loaderData.organizationsCount }
                ),
                loaderData.organizationsCount
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
        {(loaderData.selectedTypes.length > 0 ||
          loaderData.selectedFocuses.length > 0 ||
          loaderData.selectedAreas.length > 0) && (
          <div className="mv-flex mv-flex-col mv-gap-2">
            <div className="mv-overflow-auto mv-flex mv-flex-nowrap @lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-2">
              {loaderData.selectedTypes.map((selectedType) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(filter.type.name, selectedType);
                let title;
                if (selectedType in locales.organizationTypes) {
                  type LocaleKey = keyof typeof locales.organizationTypes;
                  title =
                    locales.organizationTypes[selectedType as LocaleKey].title;
                } else {
                  console.error(
                    `Organization type ${selectedType} not found in locales`
                  );
                  title = selectedType;
                }
                return (
                  <Chip key={selectedType} size="medium">
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
              {loaderData.selectedFocuses.map((selectedFocus) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(filter.focus.name, selectedFocus);
                let title;
                if (selectedFocus in locales.focuses) {
                  type LocaleKey = keyof typeof locales.focuses;
                  title = locales.focuses[selectedFocus as LocaleKey].title;
                } else {
                  console.error(`Focus ${selectedFocus} not found in locales`);
                  title = selectedFocus;
                }
                return (
                  <Chip key={selectedFocus} size="medium">
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
            </div>
            <Link
              className="mv-w-fit"
              to={`${location.pathname}${
                loaderData.submission.value.orgSortBy !== undefined
                  ? `?orgSortBy=${loaderData.submission.value.orgSortBy.value}-${loaderData.submission.value.orgSortBy.direction}`
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
        loaderData.filteredByVisibilityCount !==
          loaderData.organizationsCount ? (
          <p className="text-center text-gray-700 mb-4 mv-mx-4 @md:mv-mx-0">
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                locales.route.notShown_one,
                locales.route.notShown_other,
                loaderData.organizationsCount -
                  loaderData.filteredByVisibilityCount
              ),
              {
                count:
                  loaderData.organizationsCount -
                  loaderData.filteredByVisibilityCount,
              }
            )}
          </p>
        ) : loaderData.organizationsCount > 0 ? (
          <p className="text-center text-gray-700 mb-4">
            <strong>{loaderData.organizationsCount}</strong>{" "}
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                locales.route.itemsCountSuffix_one,
                locales.route.itemsCountSuffix_other,
                loaderData.organizationsCount
              ),
              { count: loaderData.organizationsCount }
            )}
          </p>
        ) : (
          <p className="text-center text-gray-700 mb-4">
            {locales.route.empty}
          </p>
        )}
        {loaderData.organizations.length > 0 && (
          <>
            <CardContainer type="multi row">
              {loaderData.organizations.map((organization) => {
                return (
                  <OrganizationCard
                    locales={locales}
                    key={`organization-${organization.id}`}
                    publicAccess={!loaderData.isLoggedIn}
                    organization={organization}
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
