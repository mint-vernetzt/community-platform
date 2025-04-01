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
import { ProfileCard } from "@mint-vernetzt/components/src/organisms/cards/ProfileCard";
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
import React from "react";
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
  getAllOffers,
  getAllProfiles,
  getFilterCountForSlug,
  getProfileFilterVectorForAttribute,
  getProfilesCount,
  getTakeParam,
  getVisibilityFilteredProfilesCount,
} from "./profiles.server";
import { getAreaNameBySlug, getAreasBySearchQuery } from "./utils.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { DefaultImages } from "~/images.shared";
// import styles from "../../../common/design/styles/styles.css?url";

const i18nNS = ["routes-explore-profiles", "datasets-offers"] as const;
export const handle = {
  i18n: i18nNS,
};

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

const sortValues = [
  "firstName-asc",
  "firstName-desc",
  "lastName-asc",
  "lastName-desc",
  "createdAt-desc",
] as const;

export type GetProfilesSchema = z.infer<typeof getProfilesSchema>;

export const getProfilesSchema = z.object({
  prfFilter: z
    .object({
      offer: z.array(z.string()),
      area: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (filter === undefined) {
        return {
          offer: [],
          area: [],
        };
      }
      return filter;
    }),
  prfSortBy: z
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
  prfPage: z
    .number()
    .optional()
    .transform((page) => {
      if (page === undefined) {
        return 1;
      }
      return page;
    }),
  prfAreaSearch: z
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

  const submission = parseWithZod(searchParams, { schema: getProfilesSchema });
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
    filteredByVisibilityCount = await getVisibilityFilteredProfilesCount({
      filter: submission.value.prfFilter,
    });
  }
  const profilesCount = await getProfilesCount({
    filter: submission.value.prfFilter,
  });
  const profiles = await getAllProfiles({
    filter: submission.value.prfFilter,
    sortBy: submission.value.prfSortBy,
    take,
    isLoggedIn,
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
      isChecked: boolean;
    }
  >;
  const enhancedAreas = {
    global: [] as EnhancedAreas,
    country: [] as EnhancedAreas,
    state: [] as EnhancedAreas,
    district: [] as EnhancedAreas,
  };
  const areaFilterVector = await getProfileFilterVectorForAttribute(
    "area",
    submission.value.prfFilter
  );
  for (const area of areas) {
    const vectorCount = getFilterCountForSlug(
      area.slug,
      areaFilterVector,
      "area"
    );
    const isChecked = submission.value.prfFilter.area.includes(area.slug);
    const enhancedArea = {
      ...area,
      vectorCount,
      isChecked,
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
  const offerFilterVector = await getProfileFilterVectorForAttribute(
    "offer",
    submission.value.prfFilter
  );
  const enhancedOffers = offers.map((offer) => {
    const vectorCount = getFilterCountForSlug(
      offer.slug,
      offerFilterVector,
      "offer"
    );
    const isChecked = submission.value.prfFilter.offer.includes(offer.slug);
    return { ...offer, vectorCount, isChecked };
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
    profilesCount,
    locales: routeLocales,
  };
};

export default function ExploreProfiles() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const location = useLocation();
  const submit = useSubmit();
  const debounceSubmit = useDebounceSubmit();

  const [form, fields] = useForm<GetProfilesSchema>({});

  const filter = fields.prfFilter.getFieldset();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set(
    "prfPage",
    `${loaderData.submission.value.prfPage + 1}`
  );

  const [searchQuery, setSearchQuery] = React.useState(
    loaderData.submission.value.prfAreaSearch
  );

  const currentSortValue = sortValues.find((value) => {
    return (
      value ===
      `${loaderData.submission.value.prfSortBy.value}-${loaderData.submission.value.prfSortBy.direction}`
    );
  });

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-12 mv-mt-5 @md:mv-mt-7 @lg:mv-mt-8 mv-text-center">
        <H1 className="mv-mb-4 @md:mv-mb-2 @lg:mv-mb-3" like="h0">
          {loaderData.locales.route.headline}
        </H1>
        <p>{loaderData.locales.route.intro}</p>
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

            // Need this to prevent duplicate "showFilters" parameter
            const formData = new FormData(event.currentTarget);
            formData.delete(fields.showFilters.name);
            formData.append(fields.showFilters.name, "on");
            submit(formData, { preventScrollReset });
          }}
        >
          <input name="prfPage" defaultValue="1" hidden />
          <input name="showFilters" defaultValue="on" hidden />
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
                    return (
                      <FormControl
                        {...getInputProps(filter.offer, {
                          type: "checkbox",
                          value: offer.slug,
                        })}
                        key={offer.slug}
                        // The Checkbox UI does not rerender when using the delete chips or the reset filter button
                        // This is the workarround for now -> Switching to controlled component and managing the checked status via the server response
                        defaultChecked={undefined}
                        checked={offer.isChecked}
                        readOnly
                        disabled={offer.vectorCount === 0 && !offer.isChecked}
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
                      id={fields.prfAreaSearch.id}
                      name={fields.prfAreaSearch.name}
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
                      {loaderData.locales.route.filter.districtLabel}
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
                        currentSortValue || sortValues[0]
                      ]
                    }
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {sortValues.map((sortValue) => {
                    const submissionSortValue = `${loaderData.submission.value.prfSortBy.value}-${loaderData.submission.value.prfSortBy.direction}`;
                    return (
                      <FormControl
                        {...getInputProps(fields.prfSortBy, {
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
                          {loaderData.locales.route.filter.sortBy[sortValue]}
                        </FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.ResetButton
              to={`${location.pathname}${
                loaderData.submission.value.prfSortBy !== undefined
                  ? `?prfSortBy=${loaderData.submission.value.prfSortBy.value}-${loaderData.submission.value.prfSortBy.direction}`
                  : ""
              }`}
            >
              {loaderData.locales.route.filter.reset}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {decideBetweenSingularOrPlural(
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
              )}
            </Filters.ApplyButton>
          </Filters>
          <noscript>
            <Button>{loaderData.locales.route.filter.apply}</Button>
          </noscript>
        </Form>
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
        <hr className="mv-border-t mv-border-gray-200 mv-mt-4" />
      </div>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mb-6">
        {(loaderData.selectedOffers.length > 0 ||
          loaderData.selectedAreas.length > 0) && (
          <div className="mv-flex mv-flex-col mv-gap-2">
            <div className="mv-overflow-auto mv-flex mv-flex-nowrap @lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-2">
              {loaderData.selectedOffers.map((selectedOffer) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(filter.offer.name, selectedOffer);
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
                loaderData.submission.value.prfSortBy !== undefined
                  ? `?prfSortBy=${loaderData.submission.value.prfSortBy.value}-${loaderData.submission.value.prfSortBy.direction}`
                  : ""
              }`}
              preventScrollReset
            >
              <Button
                variant="outline"
                loading={navigation.state === "loading"}
                disabled={navigation.state === "loading"}
              >
                {loaderData.locales.route.filter.reset}
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        {loaderData.filteredByVisibilityCount !== undefined &&
        loaderData.filteredByVisibilityCount > 0 ? (
          <p className="text-center text-gray-700 mb-4 mv-mx-4 @md:mv-mx-0">
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                loaderData.locales.route.notShown_singular,
                loaderData.locales.route.notShown_plural,
                loaderData.filteredByVisibilityCount
              ),
              { count: loaderData.filteredByVisibilityCount }
            )}
          </p>
        ) : loaderData.profilesCount > 0 ? (
          <p className="text-center text-gray-700 mb-4">
            <strong>{loaderData.profilesCount}</strong>{" "}
            {decideBetweenSingularOrPlural(
              loaderData.locales.route.itemsCountSuffix_singular,
              loaderData.locales.route.itemsCountSuffix_plural,
              loaderData.profilesCount
            )}
          </p>
        ) : (
          <p className="text-center text-gray-700 mb-4">
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
            {loaderData.profilesCount > loaderData.profiles.length && (
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
                    {loaderData.locales.route.more}
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
