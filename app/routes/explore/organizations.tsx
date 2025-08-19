import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import Cookies from "js-cookie";
import mapStyles from "maplibre-gl/dist/maplibre-gl.css?url";
import { useEffect, useState } from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
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
import { List } from "~/components-next/icons/List";
import { Map as MapIcon } from "~/components-next/icons/Map";
import { QuestionMark } from "~/components-next/icons/QuestionMark";
import { Map } from "~/components-next/Map";
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
import customMapStyles from "~/styles/map.css?url";
import { getFilterSchemes, type FilterSchemes } from "./all.shared";
import {
  getAllFocuses,
  getAllNetworks,
  getAllNetworkTypes,
  getAllOrganizations,
  getAllOrganizationTypes,
  getFilterCountForSlug,
  getOrganizationFilterVectorForAttribute,
  getOrganizationIds,
  getTakeParam,
} from "./organizations.server";
import { ORGANIZATION_SORT_VALUES } from "./organizations.shared";
import { getAreaNameBySlug, getAreasBySearchQuery } from "./utils.server";
import { extendSearchParams } from "~/lib/utils/searchParams";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: mapStyles },
  { rel: "stylesheet", href: customMapStyles },
];

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
    isLoggedIn,
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

  const networks = await getAllNetworks();

  const networkOrganizationIds = enhancedOrganizations.map((organization) => {
    return organization.id;
  });

  const enhancedNetworks = [];
  for (const network of networks) {
    const enhancedNetwork = { ...network };

    let logo = enhancedNetwork.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.Filter.Logo.width,
            height: ImageSizes.Organization.Filter.Logo.height,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.Filter.BlurredLogo.width,
            height: ImageSizes.Organization.Filter.BlurredLogo.height,
          },
          blur: BlurFactor,
        });
      }
    }

    const networkFilterVector = await getOrganizationFilterVectorForAttribute({
      attribute: "network",
      filter: { ...submission.value.orgFilter },
      search: submission.value.search,
      ids: networkOrganizationIds,
    });

    const vectorCount = getFilterCountForSlug(
      network.slug,
      networkFilterVector,
      "network"
    );

    enhancedNetworks.push({
      ...enhancedNetwork,
      logo,
      blurredLogo,
      vectorCount,
    });
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

  const networkTypes = await getAllNetworkTypes();
  const networkTypeOrganizationIds =
    submission.value.search.length > 0
      ? await getOrganizationIds({
          filter: { ...submission.value.orgFilter, networkType: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : organizationIds;
  const networkTypeFilterVector = await getOrganizationFilterVectorForAttribute(
    {
      attribute: "networkType",
      filter: submission.value.orgFilter,
      search: submission.value.search,
      ids: networkTypeOrganizationIds,
    }
  );
  const enhancedNetworkTypes = networkTypes.map((networkType) => {
    const vectorCount = getFilterCountForSlug(
      networkType.slug,
      networkTypeFilterVector,
      "networkType"
    );
    return { ...networkType, vectorCount };
  });

  const selectedNetworks: { slug: string; name: string }[] = [];
  for (const slug of submission.value.orgFilter.network) {
    const network = enhancedNetworks.find((network) => network.slug === slug);
    if (network) {
      selectedNetworks.push({ slug: network.slug, name: network.name });
    }
  }

  if (!searchParams.has("view")) {
    url.searchParams.set("view", submission.value.view);
    return redirect(url.toString(), { status: 302 });
  }

  return {
    isLoggedIn,
    organizations: enhancedOrganizations,
    areas: enhancedAreas,
    selectedAreas,
    focuses: enhancedFocuses,
    selectedFocuses: submission.value.orgFilter.focus,
    types: enhancedTypes,
    selectedTypes: submission.value.orgFilter.type,
    networkTypes: enhancedNetworkTypes,
    selectedNetworkTypes: submission.value.orgFilter.networkType,
    submission,
    filteredByVisibilityCount,
    organizationsCount: organizationCount,
    locales,
    networks: enhancedNetworks,
    selectedNetworks,
  };
};

export default function ExploreOrganizations() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isHydrated = useHydrated();

  const [form, fields] = useForm<FilterSchemes>({
    id: "filter-organizations",
    defaultValue: {
      ...loaderData.submission.value,
      search: [loaderData.submission.value.search.join(" ")],
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
      search: [loaderData.submission.value.search.join(" ")],
      showFilters: "",
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
        networkType: [],
        network: [],
      },
      orgPage: 1,
      orgSortBy: ORGANIZATION_SORT_VALUES[0],
      orgAreaSearch: "",
      search: [loaderData.submission.value.search.join(" ")],
      showFilters: "",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const currentSortValue = ORGANIZATION_SORT_VALUES.find((value) => {
    return value === `${loaderData.submission.value.orgSortBy}`;
  });

  let showMore = false;
  if (typeof loaderData.filteredByVisibilityCount !== "undefined") {
    showMore =
      loaderData.filteredByVisibilityCount > loaderData.organizations.length;
  } else {
    showMore = loaderData.organizationsCount > loaderData.organizations.length;
  }

  const [visibleNetworks, setVisibleNetworks] = useState<
    typeof loaderData.networks
  >(loaderData.networks);
  const handleNetworkSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const value = event.target.value;
    if (value.length >= 3) {
      setVisibleNetworks(
        loaderData.networks.filter((network) => {
          return network.name.toLowerCase().includes(value.toLowerCase());
        })
      );
    } else {
      setVisibleNetworks(loaderData.networks);
    }
  };

  const viewSearchParam = searchParams.get("view");
  const [currentView, setCurrentView] = useState<"list" | "map">(
    viewSearchParam === "map" || viewSearchParam === "list"
      ? viewSearchParam
      : "map"
  );
  useEffect(() => {
    const viewCookie = Cookies.get("mv-explore-organizations-view");
    if (viewCookie === "map") {
      setCurrentView("map");
      const mapSearchParams = extendSearchParams(searchParams, {
        addOrReplace: {
          view: "map",
        },
      });
      submit(mapSearchParams, {
        method: "get",
        preventScrollReset: true,
        replace: true,
      });
    }
    if (viewCookie === "list") {
      setCurrentView("list");
      const listSearchParams = extendSearchParams(searchParams, {
        addOrReplace: {
          view: "list",
        },
      });
      submit(listSearchParams, {
        method: "get",
        preventScrollReset: true,
        replace: true,
      });
    }
  }, [searchParams, submit]);

  const organizationsWithAddress =
    currentView === "map"
      ? loaderData.organizations
          .filter((org) => org.longitude !== null && org.latitude !== null)
          .map((organization) => {
            return {
              ...organization,
              types: organization.types.map((type) => {
                return {
                  slug: type,
                };
              }),
              networkTypes: organization.networkTypes.map((type) => {
                return {
                  slug: type,
                };
              }),
            };
          })
      : [];

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
            // if ((event.target as HTMLInputElement).name === fields.orgFilter.name) {
            //   replace = true;
            // }
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
          <ShowFiltersButton
            showFilters={loaderData.submission.value.showFilters}
          >
            {locales.route.filter.showFiltersLabel}
          </ShowFiltersButton>
          <Filters
            showFilters={searchParams.get(fields.showFilters.name) === "on"}
          >
            <Filters.Title>{locales.route.filter.title}</Filters.Title>
            <Filters.Fieldset
              {...getFieldsetProps(fields.orgFilter)}
              className="mv-flex mv-flex-wrap @lg:mv-gap-4"
              showMore={locales.route.filter.showMore}
              showLess={locales.route.filter.showLess}
            >
              {/* Organization Types Filter */}
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

              {/* Focus filter */}
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

              {/* Area filter */}
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

              {/* Network type filter */}
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.networkTypes}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedNetworkTypes
                      .map((type) => {
                        let title;
                        if (type in locales.networkTypes) {
                          type LocaleKey = keyof typeof locales.networkTypes;
                          title = locales.networkTypes[type as LocaleKey].title;
                        } else {
                          console.error(
                            `Network type ${type} not found in locales`
                          );
                          title = type;
                        }
                        return title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.networkTypes.map((networkType) => {
                    const isChecked =
                      orgFilterFieldset.networkType.initialValue &&
                      Array.isArray(orgFilterFieldset.networkType.initialValue)
                        ? orgFilterFieldset.networkType.initialValue.includes(
                            networkType.slug
                          )
                        : orgFilterFieldset.networkType.initialValue ===
                          networkType.slug;
                    return (
                      <FormControl
                        {...getInputProps(orgFilterFieldset.networkType, {
                          type: "checkbox",
                          value: networkType.slug,
                        })}
                        key={networkType.slug}
                        defaultChecked={isChecked}
                        disabled={networkType.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>
                          {(() => {
                            let title;
                            let description;
                            if (networkType.slug in locales.networkTypes) {
                              type LocaleKey =
                                keyof typeof locales.networkTypes;
                              title =
                                locales.networkTypes[
                                  networkType.slug as LocaleKey
                                ].title;
                              description =
                                locales.networkTypes[
                                  networkType.slug as LocaleKey
                                ].description;
                            } else {
                              console.error(
                                `Network type ${networkType.slug} not found in locales`
                              );
                              title = networkType.slug;
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
                          {networkType.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>

              {/* Network filter */}
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.network}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.networks
                      .map((network) => {
                        return network.name;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  <div className="mv-ml-4 mv-mr-2 mv-my-2">
                    <Input
                      onChange={handleNetworkSearch}
                      placeholder={
                        locales.route.filter.networkSearchPlaceholder
                      }
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
                  {visibleNetworks.length > 0 &&
                    visibleNetworks.map((network) => {
                      const isChecked =
                        orgFilterFieldset.network.initialValue &&
                        Array.isArray(orgFilterFieldset.network.initialValue)
                          ? orgFilterFieldset.network.initialValue.includes(
                              network.slug
                            )
                          : orgFilterFieldset.network.initialValue ===
                            network.slug;
                      return (
                        <FormControl
                          {...getInputProps(orgFilterFieldset.network, {
                            type: "checkbox",
                            value: network.slug,
                          })}
                          key={network.slug}
                          defaultChecked={isChecked}
                          disabled={network.vectorCount === 0 && !isChecked}
                        >
                          <FormControl.Label>
                            <div className="mv-flex mv-gap-2 mv-items-center">
                              <Avatar size="xs" {...network} />
                              <div className="mv-line-clamp-2">
                                {network.name}
                              </div>
                            </div>
                          </FormControl.Label>
                          <FormControl.Counter>
                            {network.vectorCount}
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
            <Button type="submit">{locales.route.filter.apply}</Button>
          </noscript>
        </Form>
      </section>
      <div
        className={
          loaderData.submission.value.showFilters === true
            ? "mv-hidden @lg:mv-block"
            : undefined
        }
      >
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
          <hr className="mv-border-t mv-border-gray-200 mv-mt-4" />
        </div>
        <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
          <div className="mv-w-full mv-flex mv-justify-center">
            <ul className="mv-grid mv-grid-flow-col mv-auto-cols-fr mv-gap-2 mv-p-1 mv-rounded-lg mv-bg-white mv-border mv-border-neutral-300">
              <li>
                <ConformForm
                  useFormOptions={{
                    id: "change-to-list-view",
                    defaultValue: {
                      ...loaderData.submission.value,
                      view: "list",
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
                    className: "mv-hidden",
                    replace: true,
                  }}
                >
                  <HiddenFilterInputsInContext />
                </ConformForm>
                <button
                  form="change-to-list-view"
                  type="submit"
                  onClick={() => {
                    setCurrentView("list");
                    Cookies.set("mv-explore-organizations-view", "list", {
                      sameSite: "strict",
                    });
                  }}
                  className={`mv-px-4 mv-py-2 mv-flex mv-gap-2 mv-rounded-[4px] hover:mv-bg-primary-50 hover:mv-text-primary focus:mv-ring-2 focus:mv-ring-primary-200 active:mv-bg-primary-100 active:mv-text-primary mv-text-xs mv-font-semibold mv-leading-4 mv-text-center ${
                    currentView === "list"
                      ? "mv-bg-primary-50 mv-text-primary"
                      : "mv-bg-white mv-text-neutral-700"
                  }`}
                >
                  <List aria-hidden="true" />
                  <span>{locales.route.view.list}</span>
                </button>
              </li>
              <li>
                <ConformForm
                  useFormOptions={{
                    id: "change-to-map-view",
                    defaultValue: {
                      ...loaderData.submission.value,
                      view: "map",
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
                    className: "mv-hidden",
                    replace: true,
                  }}
                >
                  <HiddenFilterInputsInContext />
                </ConformForm>
                <button
                  form="change-to-map-view"
                  type="submit"
                  onClick={() => {
                    setCurrentView("map");
                    Cookies.set("mv-explore-organizations-view", "map", {
                      sameSite: "strict",
                    });
                  }}
                  className={`mv-px-4 mv-py-2 mv-flex mv-gap-2 mv-rounded-[4px] hover:mv-bg-primary-50 hover:mv-text-primary focus:mv-ring-2 focus:mv-ring-primary-200 active:mv-bg-primary-100 active:mv-text-primary mv-text-xs mv-font-semibold mv-leading-4 mv-text-center ${
                    currentView === "map"
                      ? "mv-bg-primary-50 mv-text-primary"
                      : "mv-bg-white mv-text-neutral-700"
                  }`}
                >
                  <MapIcon aria-hidden="true" />
                  <span>{locales.route.view.map}</span>
                </button>
              </li>
            </ul>
          </div>
        </section>
        <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6">
          {(loaderData.selectedTypes.length > 0 ||
            loaderData.selectedFocuses.length > 0 ||
            loaderData.selectedAreas.length > 0 ||
            loaderData.selectedNetworkTypes.length > 0 ||
            loaderData.selectedNetworks.length > 0) && (
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
                      locales.organizationTypes[selectedType as LocaleKey]
                        .title;
                  } else {
                    console.error(
                      `Organization type ${selectedType} not found in locales`
                    );
                    title = selectedType;
                  }
                  return (
                    <ConformForm
                      key={selectedType}
                      useFormOptions={{
                        id: `delete-filter-${selectedType}`,
                        defaultValue: {
                          ...loaderData.submission.value,
                          orgFilter: {
                            ...loaderData.submission.value.orgFilter,
                            type: loaderData.submission.value.orgFilter.type.filter(
                              (type) => type !== selectedType
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
                {loaderData.selectedNetworkTypes.map((selectedNetworkType) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(
                    orgFilterFieldset.networkType.name,
                    selectedNetworkType
                  );
                  let title;
                  if (selectedNetworkType in locales.networkTypes) {
                    type LocaleKey = keyof typeof locales.networkTypes;
                    title =
                      locales.networkTypes[selectedNetworkType as LocaleKey]
                        .title;
                  } else {
                    console.error(
                      `Network type ${selectedNetworkType} not found in locales`
                    );
                    title = selectedNetworkType;
                  }
                  return (
                    <ConformForm
                      key={selectedNetworkType}
                      useFormOptions={{
                        id: `delete-filter-${selectedNetworkType}`,
                        defaultValue: {
                          ...loaderData.submission.value,
                          orgFilter: {
                            ...loaderData.submission.value.orgFilter,
                            networkType:
                              loaderData.submission.value.orgFilter.networkType.filter(
                                (networkType) =>
                                  networkType !== selectedNetworkType
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
                    console.error(
                      `Focus ${selectedFocus} not found in locales`
                    );
                    title = selectedFocus;
                  }
                  return (
                    <ConformForm
                      key={selectedFocus}
                      useFormOptions={{
                        id: `delete-filter-${selectedFocus}`,
                        defaultValue: {
                          ...loaderData.submission.value,
                          orgFilter: {
                            ...loaderData.submission.value.orgFilter,
                            focus:
                              loaderData.submission.value.orgFilter.focus.filter(
                                (focus) => focus !== selectedFocus
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
                    orgFilterFieldset.area.name,
                    selectedArea.slug
                  );
                  return selectedArea.name !== null ? (
                    <ConformForm
                      key={selectedArea.slug}
                      useFormOptions={{
                        id: `delete-filter-${selectedArea.slug}`,
                        defaultValue: {
                          ...loaderData.submission.value,
                          orgFilter: {
                            ...loaderData.submission.value.orgFilter,
                            area: loaderData.submission.value.orgFilter.area.filter(
                              (area) => area !== selectedArea.slug
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
                {loaderData.selectedNetworks.map((selectedNetwork) => {
                  const deleteSearchParams = new URLSearchParams(searchParams);
                  deleteSearchParams.delete(
                    orgFilterFieldset.network.name,
                    selectedNetwork.slug
                  );
                  return selectedNetwork.name !== null ? (
                    <ConformForm
                      key={selectedNetwork.slug}
                      useFormOptions={{
                        id: `delete-filter-${selectedNetwork.slug}`,
                        defaultValue: {
                          ...loaderData.submission.value,
                          orgFilter: {
                            ...loaderData.submission.value.orgFilter,
                            network:
                              loaderData.submission.value.orgFilter.network.filter(
                                (network) => network !== selectedNetwork.slug
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
                        {selectedNetwork.name}
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
          ) : loaderData.organizationsCount === 0 ? (
            <p className="mv-text-center mv-text-gray-700 mv-mb-4">
              {locales.route.empty}
            </p>
          ) : null}
          {/* TODO: Show map or list here */}
          {loaderData.organizations.length > 0 && currentView === "list" ? (
            <>
              <CardContainer type="multi row">
                {loaderData.organizations.map((organization) => {
                  return (
                    <OrganizationCard
                      locales={locales}
                      key={`organization-${organization.id}`}
                      publicAccess={!loaderData.isLoggedIn}
                      organization={organization}
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
          ) : null}
          {loaderData.organizations.length > 0 && currentView === "map" ? (
            <>
              <div className="mv-w-full mv-relative @sm:mv-rounded-2xl mv-overflow-hidden mv-h-[calc(100dvh-292px)] mv-mb-3 mv-ring-1 mv-ring-neutral-200">
                <Map
                  organizations={organizationsWithAddress}
                  locales={locales}
                />
              </div>
              <div className="mv-w-full mv-flex mv-justify-end mv-mb-4 mv-gap-2 mv-px-2 @sm:mv-px-0">
                <TextButton size="small" as="link" to={""}>
                  {locales.route.map.embed}
                </TextButton>
                <Link
                  to="/help#TODO"
                  target="_blank"
                  className="mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-rounded-full mv-text-primary mv-w-5 mv-h-5 mv-border mv-border-primary mv-bg-neutral-50 hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
                >
                  <QuestionMark />
                </Link>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </>
  );
}
