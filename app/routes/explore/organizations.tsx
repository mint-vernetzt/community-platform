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
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
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
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { Dropdown } from "~/components-next/Dropdown";
import { Filters, ShowFiltersButton } from "~/components-next/Filters";
import { FormControl } from "~/components-next/FormControl";
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
  filterProfileByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { getFilterSchemes, type FilterSchemes } from "./all.shared";
import {
  getAllFocuses,
  getAllOrganizations,
  getAllOrganizationTypes,
  getFilterCountForSlug,
  getOrganizationFilterVectorForAttribute,
  getOrganizationIds,
  getTakeParam,
} from "./organizations.server";
import { ORGANIZATION_SORT_VALUES } from "./organizations.shared";
import { getAreaNameBySlug, getAreasBySearchQuery } from "./utils.server";
import HiddenFilterInputs from "~/components-next/HiddenFilterInputs";

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
    }
  >;
  const enhancedAreas = {
    global: [] as EnhancedAreas,
    country: [] as EnhancedAreas,
    state: [] as EnhancedAreas,
    district: [] as EnhancedAreas,
  };
  const areaOrganizationIds =
    submission.value.search.length > 0
      ? await getOrganizationIds({
          filter: { ...submission.value.orgFilter, area: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : organizationIds;
  const areaFilterVector = await getOrganizationFilterVectorForAttribute({
    attribute: "area",
    filter: submission.value.orgFilter,
    search: submission.value.search,
    ids: areaOrganizationIds,
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
  const typeOrganizationIds =
    submission.value.search.length > 0
      ? await getOrganizationIds({
          filter: { ...submission.value.orgFilter, type: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : organizationIds;
  const typeFilterVector = await getOrganizationFilterVectorForAttribute({
    attribute: "type",
    filter: submission.value.orgFilter,
    search: submission.value.search,
    ids: typeOrganizationIds,
  });
  const enhancedTypes = types.map((type) => {
    const vectorCount = getFilterCountForSlug(
      type.slug,
      typeFilterVector,
      "type"
    );
    return { ...type, vectorCount };
  });

  const focuses = await getAllFocuses();
  const focusOrganizationIds =
    submission.value.search.length > 0
      ? await getOrganizationIds({
          filter: { ...submission.value.orgFilter, focus: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : organizationIds;
  const focusFilterVector = await getOrganizationFilterVectorForAttribute({
    attribute: "focus",
    filter: submission.value.orgFilter,
    search: submission.value.search,
    ids: focusOrganizationIds,
  });
  const enhancedFocuses = focuses.map((focus) => {
    const vectorCount = getFilterCountForSlug(
      focus.slug,
      focusFilterVector,
      "focus"
    );
    return { ...focus, vectorCount };
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
  const isHydrated = useHydrated();

  const [form, fields] = useForm<FilterSchemes>({
    id: "filter-organizations",
    defaultValue: {
      ...loaderData.submission.value,
      showFilters: "on",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const orgFilterFieldset = fields.orgFilter.getFieldset();

  const [loadMoreForm, loadMoreFields] = useForm<FilterSchemes>({
    id: "load-more-organizations",
    defaultValue: {
      ...loaderData.submission.value,
      orgPage: loaderData.submission.value.orgPage + 1,
      showFilters: "on",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const [resetForm, resetFields] = useForm<FilterSchemes>({
    id: "reset-organization-filters",
    defaultValue: {
      ...loaderData.submission.value,
      orgFilter: {
        area: [],
        focus: [],
        type: [],
      },
      orgPage: 1,
      orgSortBy: {
        value: ORGANIZATION_SORT_VALUES[0].split("-")[0],
        direction: ORGANIZATION_SORT_VALUES[0].split("-")[1],
      },
      orgAreaSearch: "",
      showFilters: "on",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const currentSortValue = ORGANIZATION_SORT_VALUES.find((value) => {
    return (
      value ===
      `${loaderData.submission.value.orgSortBy.value}-${loaderData.submission.value.orgSortBy.direction}`
    );
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
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
        <Form
          {...getFormProps(form)}
          method="get"
          onChange={(event) => {
            let preventScrollReset = true;
            let replace = false;
            if (
              (event.target as HTMLInputElement).name ===
              fields.showFilters.name
            ) {
              preventScrollReset = false;
            }
            if (
              (event.target as HTMLInputElement).name ===
              fields.orgAreaSearch.name
            ) {
              replace = true;
            }
            submit(event.currentTarget, {
              preventScrollReset,
              replace,
              method: "get",
            });
          }}
        >
          <HiddenFilterInputs
            fields={fields}
            defaultValue={loaderData.submission.value}
            entityLeftOut="organization"
          />

          {/* Organization Filters */}
          <input {...getInputProps(fields.orgPage, { type: "hidden" })} />
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
                    const isChecked =
                      orgFilterFieldset.type.initialValue &&
                      Array.isArray(orgFilterFieldset.type.initialValue)
                        ? orgFilterFieldset.type.initialValue.includes(
                            type.slug
                          )
                        : orgFilterFieldset.type.initialValue === type.slug;
                    return (
                      <FormControl
                        {...getInputProps(orgFilterFieldset.type, {
                          type: "checkbox",
                          value: type.slug,
                        })}
                        key={type.slug}
                        defaultChecked={isChecked}
                        disabled={type.vectorCount === 0 && !isChecked}
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
                    const isChecked =
                      orgFilterFieldset.focus.initialValue &&
                      Array.isArray(orgFilterFieldset.focus.initialValue)
                        ? orgFilterFieldset.focus.initialValue.includes(
                            focus.slug
                          )
                        : orgFilterFieldset.focus.initialValue === focus.slug;
                    return (
                      <FormControl
                        {...getInputProps(orgFilterFieldset.focus, {
                          type: "checkbox",
                          value: focus.slug,
                        })}
                        key={focus.slug}
                        defaultChecked={isChecked}
                        disabled={focus.vectorCount === 0 && !isChecked}
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
                    const isChecked =
                      orgFilterFieldset.area.initialValue &&
                      Array.isArray(orgFilterFieldset.area.initialValue)
                        ? orgFilterFieldset.area.initialValue.includes(
                            area.slug
                          )
                        : orgFilterFieldset.area.initialValue === area.slug;
                    return (
                      <FormControl
                        {...getInputProps(orgFilterFieldset.area, {
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
                      orgFilterFieldset.area.initialValue &&
                      Array.isArray(orgFilterFieldset.area.initialValue)
                        ? orgFilterFieldset.area.initialValue.includes(
                            area.slug
                          )
                        : orgFilterFieldset.area.initialValue === area.slug;
                    return (
                      <FormControl
                        {...getInputProps(orgFilterFieldset.area, {
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
                          {...getInputProps(orgFilterFieldset.area, {
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
                      {...getInputProps(fields.orgAreaSearch, {
                        type: "search",
                      })}
                      key="organization-area-search"
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
                      const isChecked =
                        orgFilterFieldset.area.initialValue &&
                        Array.isArray(orgFilterFieldset.area.initialValue)
                          ? orgFilterFieldset.area.initialValue.includes(
                              area.slug
                            )
                          : orgFilterFieldset.area.initialValue === area.slug;
                      return (
                        <FormControl
                          {...getInputProps(orgFilterFieldset.area, {
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
                        orgFilterFieldset.area.initialValue &&
                        Array.isArray(orgFilterFieldset.area.initialValue)
                          ? orgFilterFieldset.area.initialValue.includes(
                              area.slug
                            )
                          : orgFilterFieldset.area.initialValue === area.slug;
                      return (
                        <FormControl
                          {...getInputProps(orgFilterFieldset.area, {
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
            </Filters.Fieldset>
            <Filters.Fieldset {...getFieldsetProps(fields.orgSortBy)}>
              <Dropdown orientation="right">
                <Dropdown.Label>
                  <span className="@lg:mv-hidden">
                    {locales.route.filter.sortBy.label}
                    <br />
                  </span>
                  <span className="mv-font-normal @lg:mv-font-semibold">
                    {
                      loaderData.locales.route.filter.sortBy.values[
                        currentSortValue || ORGANIZATION_SORT_VALUES[0]
                      ]
                    }
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {ORGANIZATION_SORT_VALUES.map((sortValue) => {
                    return (
                      <FormControl
                        {...getInputProps(fields.orgSortBy, {
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
            <Filters.ResetButton
              to={`${location.pathname}${
                loaderData.submission.value.orgSortBy !== undefined
                  ? `?orgSortBy=${loaderData.submission.value.orgSortBy.value}-${loaderData.submission.value.orgSortBy.direction}`
                  : ""
              }`}
            >
              {isHydrated
                ? locales.route.filter.reset
                : locales.route.filter.close}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {isHydrated
                ? decideBetweenSingularOrPlural(
                    insertParametersIntoLocale(
                      locales.route.showNumberOfItems_one,
                      { count: loaderData.organizationsCount }
                    ),
                    insertParametersIntoLocale(
                      locales.route.showNumberOfItems_other,
                      { count: loaderData.organizationsCount }
                    ),
                    loaderData.organizationsCount
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
        {(loaderData.selectedTypes.length > 0 ||
          loaderData.selectedFocuses.length > 0 ||
          loaderData.selectedAreas.length > 0) && (
          <div className="mv-flex mv-flex-col mv-gap-2">
            <div className="mv-overflow-auto mv-flex mv-flex-nowrap @lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-2">
              {loaderData.selectedTypes.map((selectedType) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  orgFilterFieldset.type.name,
                  selectedType
                );
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
                deleteSearchParams.delete(
                  orgFilterFieldset.focus.name,
                  selectedFocus
                );
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
                deleteSearchParams.delete(
                  orgFilterFieldset.area.name,
                  selectedArea.slug
                );
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
        loaderData.filteredByVisibilityCount !==
          loaderData.organizationsCount ? (
          <p className="mv-text-center mv-text-gray-700 mv-mb-4 mv-mx-4 @md:mv-mx-0">
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
          <p className="mv-text-center mv-text-gray-700 mv-mb-4">
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
          <p className="mv-text-center mv-text-gray-700 mv-mb-4">
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
