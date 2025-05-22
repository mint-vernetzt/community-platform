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
import { ProfileCard } from "@mint-vernetzt/components/src/organisms/cards/ProfileCard";
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
import { type FilterSchemes, getFilterSchemes } from "./all.shared";
import {
  getAllOffers,
  getAllProfiles,
  getFilterCountForSlug,
  getProfileFilterVectorForAttribute,
  getProfileIds,
  getTakeParam,
} from "./profiles.server";
import { PROFILE_SORT_VALUES } from "./profiles.shared";
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

  console.log(submission);

  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );

  const language = await detectLanguage(request);
  const routeLocales = languageModuleMap[language]["explore/profiles"];

  const take = getTakeParam(submission.value.prfPage);
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let filteredByVisibilityCount;
  if (!isLoggedIn) {
    const profileIdsFilteredByVisibility = await getProfileIds({
      filter: submission.value.prfFilter,
      search: submission.value.search,
      isLoggedIn,
      language,
    });
    filteredByVisibilityCount = profileIdsFilteredByVisibility.length;
  }

  const profileIds = await getProfileIds({
    filter: submission.value.prfFilter,
    search: submission.value.search,
    isLoggedIn: true,
    language,
  });

  const profileCount = profileIds.length;

  const profiles = await getAllProfiles({
    filter: submission.value.prfFilter,
    sortBy: submission.value.prfSortBy,
    search: submission.value.search,
    take,
    sessionUser,
    language,
  });

  const enhancedProfiles = [];
  for (const profile of profiles) {
    let enhancedProfile = {
      ...profile,
    };

    if (!isLoggedIn) {
      // Filter profile
      type EnhancedProfile = typeof enhancedProfile;
      enhancedProfile =
        filterProfileByVisibility<EnhancedProfile>(enhancedProfile);
      // Filter organizations where profile belongs to
      enhancedProfile.memberOf = enhancedProfile.memberOf.map((relation) => {
        type OrganizationRelation = typeof relation.organization;
        const filteredOrganization =
          filterOrganizationByVisibility<OrganizationRelation>(
            relation.organization
          );
        return { ...relation, organization: { ...filteredOrganization } };
      });
    }

    // Add image urls for image proxy
    let avatar = enhancedProfile.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.Card.Avatar.width,
            height: ImageSizes.Profile.Card.Avatar.height,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.Card.BlurredAvatar.width,
            height: ImageSizes.Profile.Card.BlurredAvatar.height,
          },
          blur: BlurFactor,
        });
      }
    }
    let background = enhancedProfile.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.Card.Background.width,
            height: ImageSizes.Profile.Card.Background.height,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.Card.BlurredBackground.width,
            height: ImageSizes.Profile.Card.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Profile.Background;
      blurredBackground = DefaultImages.Profile.BlurredBackground;
    }

    const memberOf = enhancedProfile.memberOf.map((relation) => {
      let logo = relation.organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
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
      return {
        ...relation,
        organization: { ...relation.organization, logo, blurredLogo },
      };
    });

    const imageEnhancedProfile = {
      ...enhancedProfile,
      avatar,
      blurredAvatar,
      background,
      blurredBackground,
      memberOf,
    };

    const transformedProfile = {
      ...imageEnhancedProfile,
      memberOf: imageEnhancedProfile.memberOf.map((relation) => {
        return relation.organization;
      }),
      offers: imageEnhancedProfile.offers.map((relation) => {
        return relation.offer.slug;
      }),
      areas: imageEnhancedProfile.areas.map((relation) => {
        return relation.area.name;
      }),
    };

    enhancedProfiles.push(transformedProfile);
  }

  const areas = await getAreasBySearchQuery(submission.value.prfAreaSearch);
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

  const areaProfileIds =
    submission.value.search.length > 0
      ? await getProfileIds({
          filter: { ...submission.value.prfFilter, area: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : profileIds;

  const areaFilterVector = await getProfileFilterVectorForAttribute({
    attribute: "area",
    filter: submission.value.prfFilter,
    search: submission.value.search,
    ids: areaProfileIds,
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
    submission.value.prfFilter.area.map(async (slug) => {
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

  const offers = await getAllOffers();
  const offersProfileIds =
    submission.value.search.length > 0
      ? await getProfileIds({
          filter: { ...submission.value.prfFilter, offer: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : profileIds;
  const offerFilterVector = await getProfileFilterVectorForAttribute({
    attribute: "offer",
    filter: submission.value.prfFilter,
    search: submission.value.search,
    ids: offersProfileIds,
  });
  const enhancedOffers = offers.map((offer) => {
    const vectorCount = getFilterCountForSlug(
      offer.slug,
      offerFilterVector,
      "offer"
    );
    return { ...offer, vectorCount };
  });

  return {
    isLoggedIn,
    profiles: enhancedProfiles,
    areas: enhancedAreas,
    selectedAreas,
    offers: enhancedOffers,
    selectedOffers: submission.value.prfFilter.offer,
    submission,
    filteredByVisibilityCount,
    profilesCount: profileCount,
    locales: routeLocales,
  };
};

export default function ExploreProfiles() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const location = useLocation();
  const submit = useSubmit();
  const isHydrated = useHydrated();

  const [form, fields] = useForm<FilterSchemes>({
    id: "filter-profiles",
    defaultValue: {
      ...loaderData.submission.value,
      showFilters: "on",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const prfFilterFieldset = fields.prfFilter.getFieldset();

  const [loadMoreForm, loadMoreFields] = useForm<FilterSchemes>({
    id: "load-more-profiles",
    defaultValue: {
      ...loaderData.submission.value,
      prfPage: loaderData.submission.value.prfPage + 1,
      showFilters: "on",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const [resetForm, resetFields] = useForm<FilterSchemes>({
    id: "reset-profile-filters",
    defaultValue: {
      ...loaderData.submission.value,
      prfFilter: {
        area: [],
        offer: [],
      },
      prfPage: 1,
      prfSortBy: PROFILE_SORT_VALUES[0],
      prfAreaSearch: "",
      showFilters: "on",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const currentSortValue = PROFILE_SORT_VALUES.find((value) => {
    return value === `${loaderData.submission.value.prfSortBy}`;
  });

  let showMore = false;
  if (typeof loaderData.filteredByVisibilityCount !== "undefined") {
    showMore =
      loaderData.filteredByVisibilityCount > loaderData.profiles.length;
  } else {
    showMore = loaderData.profilesCount > loaderData.profiles.length;
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
              fields.prfAreaSearch.name
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
            entityLeftOut="profile"
          />

          {/* Profile Filters */}
          <input {...getInputProps(fields.prfPage, { type: "hidden" })} />
          <ShowFiltersButton>
            {loaderData.locales.route.filter.showFiltersLabel}
          </ShowFiltersButton>
          <Filters
            showFilters={searchParams.get(fields.showFilters.name) === "on"}
          >
            <Filters.Title>
              {loaderData.locales.route.filter.title}
            </Filters.Title>

            <Filters.Fieldset
              className="mv-flex mv-flex-wrap @lg:mv-gap-4"
              {...getFieldsetProps(fields.prfFilter)}
            >
              <Dropdown>
                <Dropdown.Label>
                  {loaderData.locales.route.filter.offers}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedOffers
                      .map((selectedOffer) => {
                        if (
                          selectedOffer in loaderData.locales.offers ===
                          false
                        ) {
                          console.error(
                            `No locale found for offer ${selectedOffer}`
                          );
                          return selectedOffer;
                        }
                        type LocaleKey = keyof typeof loaderData.locales.offers;
                        return loaderData.locales.offers[
                          selectedOffer as LocaleKey
                        ].title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.offers.map((offer) => {
                    let title;
                    let description;
                    if (offer.slug in loaderData.locales.offers === false) {
                      console.error(`No locale found for offer ${offer.slug}`);
                      title = offer.slug;
                      description = null;
                    } else {
                      type LocaleKey = keyof typeof loaderData.locales.offers;
                      title =
                        loaderData.locales.offers[offer.slug as LocaleKey]
                          .title;
                      description =
                        loaderData.locales.offers[offer.slug as LocaleKey]
                          .description;
                    }
                    const isChecked =
                      prfFilterFieldset.offer.initialValue &&
                      Array.isArray(prfFilterFieldset.offer.initialValue)
                        ? prfFilterFieldset.offer.initialValue.includes(
                            offer.slug
                          )
                        : prfFilterFieldset.offer.initialValue === offer.slug;
                    return (
                      <FormControl
                        {...getInputProps(prfFilterFieldset.offer, {
                          type: "checkbox",
                          value: offer.slug,
                        })}
                        key={offer.slug}
                        defaultChecked={isChecked}
                        disabled={offer.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>
                          {title}
                          {description !== null ? (
                            <p className="mv-text-sm">{description}</p>
                          ) : null}
                        </FormControl.Label>
                        <FormControl.Counter>
                          {offer.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {loaderData.locales.route.filter.areas}
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
                      prfFilterFieldset.area.initialValue &&
                      Array.isArray(prfFilterFieldset.area.initialValue)
                        ? prfFilterFieldset.area.initialValue.includes(
                            area.slug
                          )
                        : prfFilterFieldset.area.initialValue === area.slug;
                    return (
                      <FormControl
                        {...getInputProps(prfFilterFieldset.area, {
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
                      prfFilterFieldset.area.initialValue &&
                      Array.isArray(prfFilterFieldset.area.initialValue)
                        ? prfFilterFieldset.area.initialValue.includes(
                            area.slug
                          )
                        : prfFilterFieldset.area.initialValue === area.slug;
                    return (
                      <FormControl
                        {...getInputProps(prfFilterFieldset.area, {
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
                          {...getInputProps(prfFilterFieldset.area, {
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
                      {...getInputProps(fields.prfAreaSearch, {
                        type: "search",
                      })}
                      key="profile-area-search"
                      placeholder={
                        loaderData.locales.route.filter.searchAreaPlaceholder
                      }
                    >
                      <Input.Label htmlFor={fields.prfAreaSearch.id} hidden>
                        {loaderData.locales.route.filter.searchAreaPlaceholder}
                      </Input.Label>
                      <Input.HelperText>
                        {loaderData.locales.route.filter.searchAreaHelper}
                      </Input.HelperText>
                      <Input.Controls>
                        <noscript>
                          <Button>
                            {loaderData.locales.route.filter.searchAreaButton}
                          </Button>
                        </noscript>
                      </Input.Controls>
                    </Input>
                  </div>
                  {loaderData.areas.state.length > 0 && (
                    <Dropdown.Legend>
                      {loaderData.locales.route.filter.stateLabel}
                    </Dropdown.Legend>
                  )}
                  {loaderData.areas.state.length > 0 &&
                    loaderData.areas.state.map((area) => {
                      const isChecked =
                        prfFilterFieldset.area.initialValue &&
                        Array.isArray(prfFilterFieldset.area.initialValue)
                          ? prfFilterFieldset.area.initialValue.includes(
                              area.slug
                            )
                          : prfFilterFieldset.area.initialValue === area.slug;
                      return (
                        <FormControl
                          {...getInputProps(prfFilterFieldset.area, {
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
                      {loaderData.locales.route.filter.districtLabel}
                    </Dropdown.Legend>
                  )}
                  {loaderData.areas.district.length > 0 &&
                    loaderData.areas.district.map((area) => {
                      const isChecked =
                        prfFilterFieldset.area.initialValue &&
                        Array.isArray(prfFilterFieldset.area.initialValue)
                          ? prfFilterFieldset.area.initialValue.includes(
                              area.slug
                            )
                          : prfFilterFieldset.area.initialValue === area.slug;
                      return (
                        <FormControl
                          {...getInputProps(prfFilterFieldset.area, {
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
            <Filters.Fieldset {...getFieldsetProps(fields.prfSortBy)}>
              <Dropdown orientation="right">
                <Dropdown.Label>
                  <span className="@lg:mv-hidden">
                    {loaderData.locales.route.filter.sortBy.label}
                    <br />
                  </span>
                  <span className="mv-font-normal @lg:mv-font-semibold">
                    {
                      loaderData.locales.route.filter.sortBy[
                        currentSortValue || PROFILE_SORT_VALUES[0]
                      ]
                    }
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {PROFILE_SORT_VALUES.map((sortValue) => {
                    return (
                      <FormControl
                        {...getInputProps(fields.prfSortBy, {
                          type: "radio",
                          value: sortValue,
                        })}
                        key={sortValue}
                        defaultChecked={currentSortValue === sortValue}
                      >
                        <FormControl.Label>
                          {loaderData.locales.route.filter.sortBy[sortValue]}
                        </FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.ResetButton form={resetForm.id}>
              {isHydrated
                ? loaderData.locales.route.filter.reset
                : loaderData.locales.route.filter.close}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {isHydrated
                ? decideBetweenSingularOrPlural(
                    insertParametersIntoLocale(
                      loaderData.locales.route.showNumberOfItems_singular,
                      {
                        count: loaderData.profilesCount,
                      }
                    ),
                    insertParametersIntoLocale(
                      loaderData.locales.route.showNumberOfItems_plural,
                      {
                        count: loaderData.profilesCount,
                      }
                    ),
                    loaderData.profilesCount
                  )
                : loaderData.locales.route.filter.apply}
            </Filters.ApplyButton>
          </Filters>
          <noscript className="mv-hidden @lg:mv-block mv-mt-2">
            <Button>{loaderData.locales.route.filter.apply}</Button>
          </noscript>
        </Form>
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
        <hr className="mv-border-t mv-border-gray-200 mv-mt-4" />
      </div>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6">
        {(loaderData.selectedOffers.length > 0 ||
          loaderData.selectedAreas.length > 0) && (
          <div className="mv-flex mv-flex-col mv-gap-2">
            <div className="mv-overflow-auto mv-flex mv-flex-nowrap @lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-2">
              {loaderData.selectedOffers.map((selectedOffer) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  prfFilterFieldset.offer.name,
                  selectedOffer
                );
                let title;
                if (selectedOffer in loaderData.locales.offers === false) {
                  console.error(`No locale found for offer ${selectedOffer}`);
                  title = selectedOffer;
                } else {
                  type LocaleKey = keyof typeof loaderData.locales.offers;
                  title =
                    loaderData.locales.offers[selectedOffer as LocaleKey].title;
                }
                return (
                  <Chip key={selectedOffer} size="medium">
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
                  prfFilterFieldset.area.name,
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
                {loaderData.locales.route.filter.reset}
              </Button>
            </Form>
          </div>
        )}
      </section>

      <section className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        {typeof loaderData.filteredByVisibilityCount !== "undefined" &&
        loaderData.filteredByVisibilityCount !== loaderData.profilesCount ? (
          <p className="mv-text-center mv-text-gray-700 mv-mb-4 mv-mx-4 @md:mv-mx-0">
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                loaderData.locales.route.notShown_singular,
                loaderData.locales.route.notShown_plural,
                loaderData.profilesCount - loaderData.filteredByVisibilityCount
              ),
              {
                count:
                  loaderData.profilesCount -
                  loaderData.filteredByVisibilityCount,
              }
            )}
          </p>
        ) : loaderData.profilesCount > 0 ? (
          <p className="mv-text-center mv-text-gray-700 mv-mb-4">
            <strong>{loaderData.profilesCount}</strong>{" "}
            {decideBetweenSingularOrPlural(
              loaderData.locales.route.itemsCountSuffix_singular,
              loaderData.locales.route.itemsCountSuffix_plural,
              loaderData.profilesCount
            )}
          </p>
        ) : (
          <p className="mv-text-center mv-text-gray-700 mv-mb-4">
            {loaderData.locales.route.empty}
          </p>
        )}
        {loaderData.profiles.length > 0 && (
          <>
            <CardContainer type="multi row">
              {loaderData.profiles.map((profile) => {
                return (
                  <ProfileCard
                    locales={loaderData.locales}
                    key={`profile-${profile.id}`}
                    publicAccess={!loaderData.isLoggedIn}
                    profile={profile}
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
                    {loaderData.locales.route.more}
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
