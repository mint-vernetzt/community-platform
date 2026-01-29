import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { ProfileCard } from "@mint-vernetzt/components/src/organisms/cards/ProfileCard";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
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
import {
  HiddenFilterInputs,
  HiddenFilterInputsInContext,
} from "~/components-next/HiddenFilterInputs";
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
import { getAllAreas, getAreaNameBySlug } from "./utils.server";
import { useEffect, useState } from "react";

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
  const routeLocales = languageModuleMap[language]["explore/profiles"];

  const take = getTakeParam(submission.value.prfPage);
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let filteredByVisibilityCount;
  let profileIdsFilteredByVisibility;
  if (!isLoggedIn) {
    profileIdsFilteredByVisibility = await getProfileIds({
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
    sortBy: submission.value.prfSortBy,
    take,
    profileIds:
      typeof profileIdsFilteredByVisibility !== "undefined"
        ? profileIdsFilteredByVisibility
        : profileIds,
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

  const areas = await getAllAreas();
  type EnhancedAreas = Array<
    ArrayElement<Awaited<ReturnType<typeof getAllAreas>>> & {
      vectorCount: ReturnType<typeof getFilterCountForSlug>;
      isVisible: boolean;
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
      isVisible: true,
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
  const submit = useSubmit();
  const isHydrated = useHydrated();

  const [form, fields] = useForm<FilterSchemes>({
    id: "filter-profiles",
    defaultValue: {
      ...loaderData.submission.value,
      search: [loaderData.submission.value.search.join(" ")],
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
      search: [loaderData.submission.value.search.join(" ")],
      showFilters: "",
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
      search: [loaderData.submission.value.search.join(" ")],
      showFilters: "",
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

  const [visibleAreas, setVisibleAreas] = useState<typeof loaderData.areas>(
    loaderData.areas
  );
  const handleAreaSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const value = event.target.value.trim().toLowerCase();
    if (value.length >= 3) {
      setVisibleAreas({
        global: loaderData.areas.global.map((area) => {
          if (!area.name.toLowerCase().includes(value)) {
            return { ...area, isVisible: false };
          }
          return { ...area, isVisible: true };
        }),
        country: loaderData.areas.country.map((area) => {
          if (!area.name.toLowerCase().includes(value)) {
            return { ...area, isVisible: false };
          }
          return { ...area, isVisible: true };
        }),
        state: loaderData.areas.state.map((area) => {
          if (!area.name.toLowerCase().includes(value)) {
            return { ...area, isVisible: false };
          }
          return { ...area, isVisible: true };
        }),
        district: loaderData.areas.district.map((area) => {
          if (!area.name.toLowerCase().includes(value)) {
            return { ...area, isVisible: false };
          }
          return { ...area, isVisible: true };
        }),
      });
    } else {
      setVisibleAreas(loaderData.areas);
    }
  };

  useEffect(() => {
    setVisibleAreas(loaderData.areas);
  }, [loaderData.areas]);

  return (
    <>
      <section className="w-full mx-auto px-4 xl:px-6 max-w-2xl mb-4">
        <Form
          {...getFormProps(form)}
          method="get"
          onChange={(event) => {
            let preventScrollReset = true;
            if (
              (event.target as HTMLInputElement).name ===
              fields.showFilters.name
            ) {
              preventScrollReset = false;
            }
            void submit(event.currentTarget, {
              preventScrollReset,
              method: "get",
            });
          }}
          onReset={() => setVisibleAreas(loaderData.areas)}
        >
          <HiddenFilterInputs
            fields={fields}
            defaultValue={loaderData.submission.value}
            entityLeftOut="profile"
          />

          {/* Profile Filters */}
          <input {...getInputProps(fields.prfPage, { type: "hidden" })} />
          <ShowFiltersButton
            showFilters={loaderData.submission.value.showFilters}
          >
            {loaderData.locales.route.filter.showFiltersLabel}
          </ShowFiltersButton>
          <Filters
            showFilters={searchParams.get(fields.showFilters.name) === "on"}
          >
            <Filters.Title>
              {loaderData.locales.route.filter.title}
            </Filters.Title>

            <Filters.Fieldset
              className="flex flex-wrap @lg:gap-4"
              {...getFieldsetProps(fields.prfFilter)}
            >
              <Dropdown>
                <Dropdown.Label>
                  {loaderData.locales.route.filter.offers}
                  <span className="font-normal @lg:hidden">
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
                            <p className="text-sm">{description}</p>
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
                  <span className="font-normal @lg:hidden">
                    <br />
                    {loaderData.selectedAreas
                      .map((area) => {
                        return area.name;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {isHydrated ? (
                    <div className="mx-4 my-2">
                      <Input
                        id="prf-area-search"
                        onChange={handleAreaSearch}
                        placeholder={
                          loaderData.locales.route.filter.searchAreaPlaceholder
                        }
                      >
                        <Input.Label htmlFor="prf-area-search" hidden>
                          {
                            loaderData.locales.route.filter
                              .searchAreaPlaceholder
                          }
                        </Input.Label>
                        <Input.HelperText>
                          {loaderData.locales.route.filter.searchAreaHelper}
                        </Input.HelperText>
                        <Input.SearchIcon />
                        <Input.ClearIcon />
                      </Input>
                    </div>
                  ) : null}
                  {visibleAreas.global.map((area) => {
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
                        hidden={!area.isVisible}
                      >
                        <FormControl.Label>{area.name}</FormControl.Label>
                        <FormControl.Counter>
                          {area.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                  {visibleAreas.country.map((area) => {
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
                        hidden={!area.isVisible}
                      >
                        <FormControl.Label>{area.name}</FormControl.Label>
                        <FormControl.Counter>
                          {area.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                  {(visibleAreas.country.some((area) => area.isVisible) ||
                    visibleAreas.global.some((area) => area.isVisible)) &&
                    visibleAreas.state.some((area) => area.isVisible) && (
                      <Dropdown.Divider />
                    )}
                  {visibleAreas.state.some((area) => area.isVisible) && (
                    <Dropdown.Legend>
                      {loaderData.locales.route.filter.stateLabel}
                    </Dropdown.Legend>
                  )}
                  {visibleAreas.state.length > 0 &&
                    visibleAreas.state.map((area) => {
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
                          hidden={!area.isVisible}
                        >
                          <FormControl.Label>{area.name}</FormControl.Label>
                          <FormControl.Counter>
                            {area.vectorCount}
                          </FormControl.Counter>
                        </FormControl>
                      );
                    })}
                  {visibleAreas.state.some((area) => area.isVisible) &&
                    visibleAreas.district.some((area) => area.isVisible) && (
                      <Dropdown.Divider />
                    )}
                  {visibleAreas.district.some((area) => area.isVisible) && (
                    <Dropdown.Legend>
                      {loaderData.locales.route.filter.districtLabel}
                    </Dropdown.Legend>
                  )}
                  {visibleAreas.district.length > 0 &&
                    visibleAreas.district.map((area) => {
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
                          hidden={!area.isVisible}
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
                  <span className="@lg:hidden">
                    {loaderData.locales.route.filter.sortBy.label}
                    <br />
                  </span>
                  <span className="font-normal @lg:font-semibold">
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
          <noscript className="hidden @lg:block mt-2">
            <Button>{loaderData.locales.route.filter.apply}</Button>
          </noscript>
        </Form>
      </section>
      <div
        className={
          loaderData.submission.value.showFilters === true
            ? "hidden @lg:block"
            : undefined
        }
      >
        <div className="w-full mx-auto px-4 xl:px-6 max-w-2xl mb-4">
          <hr className="border-t border-gray-200 mt-4" />
        </div>
        <section className="w-full mx-auto px-4 xl:px-6 max-w-2xl mb-6">
          {(loaderData.selectedOffers.length > 0 ||
            loaderData.selectedAreas.length > 0) && (
            <div className="flex flex-col gap-2">
              <div className="overflow-auto flex flex-nowrap @lg:flex-wrap w-full gap-2 pb-2">
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
                      loaderData.locales.offers[selectedOffer as LocaleKey]
                        .title;
                  }
                  return (
                    <ConformForm
                      key={selectedOffer}
                      useFormOptions={{
                        id: `delete-filter-${selectedOffer}`,
                        defaultValue: {
                          ...loaderData.submission.value,
                          prfFilter: {
                            ...loaderData.submission.value.prfFilter,
                            offer:
                              loaderData.submission.value.prfFilter.offer.filter(
                                (offer) => offer !== selectedOffer
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
                    prfFilterFieldset.area.name,
                    selectedArea.slug
                  );
                  return selectedArea.name !== null ? (
                    <ConformForm
                      key={selectedArea.slug}
                      useFormOptions={{
                        id: `delete-filter-${selectedArea.slug}`,
                        defaultValue: {
                          ...loaderData.submission.value,
                          prfFilter: {
                            ...loaderData.submission.value.prfFilter,
                            area: loaderData.submission.value.prfFilter.area.filter(
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
              </div>
              <Form
                {...getFormProps(resetForm)}
                method="get"
                preventScrollReset
                className="w-fit"
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

        <section className="w-full mx-auto px-4 xl:px-6 max-w-2xl mb-10 @lg:mb-12 @xl:mb-14">
          {typeof loaderData.filteredByVisibilityCount !== "undefined" &&
          loaderData.filteredByVisibilityCount !== loaderData.profilesCount ? (
            <p className="text-center text-gray-700 mb-4 mx-4 @md:mx-0">
              {insertParametersIntoLocale(
                decideBetweenSingularOrPlural(
                  loaderData.locales.route.notShown_singular,
                  loaderData.locales.route.notShown_plural,
                  loaderData.profilesCount -
                    loaderData.filteredByVisibilityCount
                ),
                {
                  count:
                    loaderData.profilesCount -
                    loaderData.filteredByVisibilityCount,
                }
              )}
            </p>
          ) : loaderData.profilesCount === 0 ? (
            <p className="text-center text-gray-700 mb-4">
              {loaderData.locales.route.empty}
            </p>
          ) : null}
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
                      as="h2"
                      prefetch="intent"
                    />
                  );
                })}
              </CardContainer>
              {showMore && (
                <div className="w-full flex justify-center mt-4 @lg:mt-6 @xl:mt-8">
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
      </div>
    </>
  );
}
