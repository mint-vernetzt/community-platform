import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { parseWithZod } from "@conform-to/zod-v1";
import {
  Button,
  CardContainer,
  Chip,
  Input,
  ProfileCard,
} from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useDebounceSubmit } from "remix-utils/use-debounce-submit";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1, H2 } from "~/components/Heading/Heading";
import { GravityType, getImageURL } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import {
  getAllOffers,
  getAllProfiles,
  getFilterCountForSlug,
  getProfileFilterVector,
  getProfilesCount,
  getTakeParam,
  getVisibilityFilteredProfilesCount,
} from "./profiles.server";
import { type ArrayElement } from "~/lib/utils/types";
import { getFeatureAbilities } from "~/lib/utils/application";
import { getAreaNameBySlug, getAreasBySearchQuery } from "./utils.server";
import { Dropdown, FormControl } from "./__components";
import classNames from "classnames";
// import styles from "../../../common/design/styles/styles.css";

const i18nNS = ["routes/explore/profiles"];
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

const getProfilesSchema = z.object({
  filter: z
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
  search: z
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
  const submission = parseWithZod(searchParams, { schema: getProfilesSchema });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );
  const take = getTakeParam(submission.value.page);
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["filter"]);
  if (abilities.filter.hasAccess === false) {
    return redirect("/explore/profiles");
  }

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let filteredByVisibilityCount;
  if (!isLoggedIn) {
    filteredByVisibilityCount = await getVisibilityFilteredProfilesCount({
      filter: submission.value.filter,
    });
  }
  const profilesCount = await getProfilesCount({
    filter: submission.value.filter,
  });
  const profiles = await getAllProfiles({
    filter: submission.value.filter,
    sortBy: submission.value.sortBy,
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
    if (enhancedProfile.avatar !== null) {
      const publicURL = getPublicURL(authClient, enhancedProfile.avatar);
      if (publicURL !== null) {
        enhancedProfile.avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
          gravity: GravityType.center,
        });
      }
    }
    if (enhancedProfile.background !== null) {
      const publicURL = getPublicURL(authClient, enhancedProfile.background);
      if (publicURL !== null) {
        enhancedProfile.background = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
          gravity: GravityType.center,
        });
      }
    }
    enhancedProfile.memberOf = enhancedProfile.memberOf.map((relation) => {
      let logo = relation.organization.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
        });
      }
      return { ...relation, organization: { ...relation.organization, logo } };
    });

    const transformedProfile = {
      ...enhancedProfile,
      memberOf: enhancedProfile.memberOf.map((relation) => {
        return relation.organization;
      }),
      offers: enhancedProfile.offers.map((relation) => {
        return relation.offer.title;
      }),
      areas: enhancedProfile.areas.map((relation) => {
        return relation.area.name;
      }),
    };

    enhancedProfiles.push(transformedProfile);
  }

  const filterVector = await getProfileFilterVector({
    filter: submission.value.filter,
  });

  const areas = await getAreasBySearchQuery(submission.value.search);
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
  for (const area of areas) {
    const vectorCount = getFilterCountForSlug(area.slug, filterVector, "area");
    let isChecked;
    // TODO: Remove 'area.slug === null' when slug isn't optional anymore (after migration)
    if (area.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.area.includes(area.slug);
    }
    const enhancedArea = {
      ...area,
      vectorCount,
      isChecked,
    };
    enhancedAreas[area.type].push(enhancedArea);
  }
  const selectedAreas = await Promise.all(
    submission.value.filter.area.map(async (slug) => {
      const vectorCount = getFilterCountForSlug(slug, filterVector, "area");
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
  const enhancedOffers = offers.map((offer) => {
    const vectorCount = getFilterCountForSlug(
      offer.slug,
      filterVector,
      "offer"
    );
    let isChecked;
    // TODO: Remove 'offer.slug === null' when slug isn't optional anymore (after migration)
    if (offer.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.offer.includes(offer.slug);
    }
    return { ...offer, vectorCount, isChecked };
  });
  const selectedOffers = submission.value.filter.offer.map((slug) => {
    const offerMatch = offers.find((offer) => {
      return offer.slug === slug;
    });
    return {
      slug,
      title: offerMatch?.title || null,
    };
  });

  return json({
    isLoggedIn,
    profiles: enhancedProfiles,
    areas: enhancedAreas,
    selectedAreas,
    offers: enhancedOffers,
    selectedOffers,
    submission,
    filteredByVisibilityCount,
    profilesCount,
  });
};

// TODO: sortBy list links, deaktivierte checkboxen grau

export default function ExploreProfiles() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const location = useLocation();
  const submit = useSubmit();
  const debounceSubmit = useDebounceSubmit();
  const { t } = useTranslation(i18nNS);

  const [form, fields] = useForm<GetProfilesSchema>({
    lastResult: loaderData.submission,
    defaultValue: loaderData.submission.value,
  });

  const filter = fields.filter.getFieldset();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${loaderData.submission.value.page + 1}`);

  const [searchQuery, setSearchQuery] = React.useState(
    loaderData.submission.value.search
  );

  const filterClasses = classNames(
    "mv-fixed mv-overflow-scroll lg:mv-overflow-visible lg:mv-relative mv-z-20 mv-bg-white mv-w-full mv-h-dvh lg:mv-h-fit mv-left-0 mv-bottom-0 lg:mv-justify-between mv-flex mv-flex-col lg:mv-flex-row",
    loaderData.submission.value.showFilters === true
      ? "mv-flex"
      : "mv-hidden lg:mv-flex"
  );

  return (
    <>
      <section className="mv-container mv-mb-12 mv-mt-5 md:mv-mt-7 lg:mv-mt-8 mv-text-center">
        <H1 className="mv-mb-4 md:mv-mb-2 lg:mv-mb-3" like="h0">
          {t("headline")}
        </H1>
        <p>{t("intro")}</p>
      </section>

      <section className="mv-container mv-mb-4">
        <Form
          {...getFormProps(form)}
          method="get"
          onChange={(event) => {
            submit(event.currentTarget, { preventScrollReset: true });
          }}
          preventScrollReset
        >
          <input name="page" defaultValue="1" hidden />
          <div className="lg:mv-hidden mv-text-center">
            <label
              className="mv-inline-flex mv-items-center mv-font-semibold mv-whitespace-nowrap mv-px-6 mv-py-2.5 mv-border mv-rounded-lg mv-border-primary-500 mv-gap-2 mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-cursor-pointer"
              aria-label={t("filter.showFiltersLabel")}
            >
              {t("filter.showFiltersLabel")}
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.125 6.75C13.125 5.57639 14.0764 4.625 15.25 4.625C16.4236 4.625 17.375 5.57639 17.375 6.75C17.375 7.92361 16.4236 8.875 15.25 8.875C14.0764 8.875 13.125 7.9236 13.125 6.75Z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
                <path
                  d="M13 6.75L2 6.75"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
                <path
                  d="M6.875 13.25C6.875 14.4236 5.9236 15.375 4.75 15.375C3.5764 15.375 2.625 14.4236 2.625 13.25C2.625 12.0764 3.57639 11.125 4.75 11.125C5.9236 11.125 6.875 12.0764 6.875 13.25Z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
                <path
                  d="M7 13.25L18 13.25"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
              </svg>

              <input
                {...getInputProps(fields.showFilters, {
                  type: "checkbox",
                  value: loaderData.submission.value.showFilters === true,
                })}
                className="mv-hidden"
              />
            </label>
          </div>
          {/* <div className="mv-my-4 mv-flex mv-justify-between"> */}
          <div className={filterClasses}>
            <div className="mv-flex mv-justify-between mv-items-center mv-px-4 mv-pt-8 mv-pb-4 mv-shadow-lg lg:mv-hidden">
              <h2 className="mv-w-full mv-mb-0 mv-text-center mv-text-gray-700 mv-text-base">
                {t("filter.title")}
              </h2>
              <Link
                className="lg:mv-hidden"
                to={`./${location.search
                  .replace("showFilters=on", "")
                  .replace("&&", "&")
                  .replace("?&", "?")}`}
                preventScrollReset
                aria-label="Close filters"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="33"
                  height="33"
                  viewBox="0 0 33 33"
                  fill="none"
                >
                  <path
                    d="M9.58226 9.58226C9.67806 9.48623 9.79186 9.41003 9.91715 9.35804C10.0424 9.30606 10.1767 9.2793 10.3124 9.2793C10.448 9.2793 10.5823 9.30606 10.7076 9.35804C10.8329 9.41003 10.9467 9.48623 11.0425 9.58226L16.4999 15.0417L21.9573 9.58226C22.0531 9.48638 22.167 9.41033 22.2922 9.35844C22.4175 9.30654 22.5518 9.27984 22.6874 9.27984C22.823 9.27984 22.9573 9.30654 23.0825 9.35844C23.2078 9.41033 23.3216 9.48638 23.4175 9.58226C23.5134 9.67815 23.5895 9.79197 23.6413 9.91725C23.6932 10.0425 23.7199 10.1768 23.7199 10.3124C23.7199 10.448 23.6932 10.5823 23.6413 10.7075C23.5895 10.8328 23.5134 10.9466 23.4175 11.0425L17.9581 16.4999L23.4175 21.9573C23.5134 22.0531 23.5895 22.167 23.6413 22.2922C23.6932 22.4175 23.7199 22.5518 23.7199 22.6874C23.7199 22.823 23.6932 22.9573 23.6413 23.0825C23.5895 23.2078 23.5134 23.3216 23.4175 23.4175C23.3216 23.5134 23.2078 23.5895 23.0825 23.6413C22.9573 23.6932 22.823 23.7199 22.6874 23.7199C22.5518 23.7199 22.4175 23.6932 22.2922 23.6413C22.167 23.5895 22.0531 23.5134 21.9573 23.4175L16.4999 17.9581L11.0425 23.4175C10.9466 23.5134 10.8328 23.5895 10.7075 23.6413C10.5823 23.6932 10.448 23.7199 10.3124 23.7199C10.1768 23.7199 10.0425 23.6932 9.91725 23.6413C9.79197 23.5895 9.67815 23.5134 9.58226 23.4175C9.48638 23.3216 9.41033 23.2078 9.35844 23.0825C9.30654 22.9573 9.27984 22.823 9.27984 22.6874C9.27984 22.5518 9.30654 22.4175 9.35844 22.2922C9.41033 22.167 9.48638 22.0531 9.58226 21.9573L15.0417 16.4999L9.58226 11.0425C9.48623 10.9467 9.41003 10.8329 9.35804 10.7076C9.30606 10.5823 9.2793 10.448 9.2793 10.3124C9.2793 10.1767 9.30606 10.0424 9.35804 9.91715C9.41003 9.79186 9.48623 9.67806 9.58226 9.58226Z"
                    fill="#3C4658"
                  />
                </svg>
              </Link>
            </div>
            <div className="mv-flex mv-flex-col-reverse lg:mv-flex-row mv-grow mv-px-4 lg:mv-px-0 lg:mv-justify-between">
              <fieldset
                {...getFieldsetProps(fields.filter)}
                className="mv-flex mv-flex-wrap lg:mv-gap-4"
              >
                <Dropdown>
                  <Dropdown.Label>
                    {t("filter.offers")}
                    <span className="mv-font-normal lg:mv-hidden">
                      <br />
                      {loaderData.selectedOffers
                        .map((offer) => {
                          return offer.title;
                        })
                        .join(", ")}
                    </span>
                  </Dropdown.Label>
                  <Dropdown.List>
                    {loaderData.offers.map((offer) => {
                      return (
                        <FormControl
                          {...getInputProps(filter.offer, {
                            type: "checkbox",
                            // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                            value: offer.slug || undefined,
                          })}
                          key={offer.slug}
                          defaultChecked={offer.isChecked}
                          disabled={
                            (offer.vectorCount === 0 && !offer.isChecked) ||
                            navigation.state === "loading"
                          }
                        >
                          <FormControl.Label>
                            {offer.title}
                            {offer.description !== null ? (
                              <p className="mv-text-sm">{offer.description}</p>
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
                    {t("filter.areas")}
                    <span className="mv-font-normal lg:mv-hidden">
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
                            // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                            value: area.slug || undefined,
                          })}
                          key={area.slug}
                          defaultChecked={area.isChecked}
                          disabled={
                            (area.vectorCount === 0 && !area.isChecked) ||
                            navigation.state === "loading"
                          }
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
                            // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                            value: area.slug || undefined,
                          })}
                          key={area.slug}
                          defaultChecked={area.isChecked}
                          disabled={
                            (area.vectorCount === 0 && !area.isChecked) ||
                            navigation.state === "loading"
                          }
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
                            defaultChecked
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
                        id={fields.search.id}
                        name={fields.search.name}
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
                        placeholder={t("filter.searchAreaPlaceholder")}
                      >
                        <Input.Label htmlFor={fields.search.id} hidden>
                          {t("filter.searchAreaPlaceholder")}
                        </Input.Label>
                        <Input.HelperText>
                          {t("filter.searchAreaHelper")}
                        </Input.HelperText>
                        <Input.Controls>
                          <noscript>
                            <Button>{t("filter.searchAreaButton")}</Button>
                          </noscript>
                        </Input.Controls>
                      </Input>
                    </div>
                    {loaderData.areas.state.length > 0 && (
                      <Dropdown.Legend>
                        {t("filter.stateLabel")}
                      </Dropdown.Legend>
                    )}
                    {loaderData.areas.state.length > 0 &&
                      loaderData.areas.state.map((area) => {
                        return (
                          <FormControl
                            {...getInputProps(filter.area, {
                              type: "checkbox",
                              // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                              value: area.slug || undefined,
                            })}
                            key={area.slug}
                            defaultChecked={area.isChecked}
                            disabled={
                              (area.vectorCount === 0 && !area.isChecked) ||
                              navigation.state === "loading"
                            }
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
                        {t("filter.districtLabel")}
                      </Dropdown.Legend>
                    )}
                    {loaderData.areas.district.length > 0 &&
                      loaderData.areas.district.map((area) => {
                        return (
                          <FormControl
                            {...getInputProps(filter.area, {
                              type: "checkbox",
                              // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                              value: area.slug || undefined,
                            })}
                            key={area.slug}
                            defaultChecked={area.isChecked}
                            disabled={
                              (area.vectorCount === 0 && !area.isChecked) ||
                              navigation.state === "loading"
                            }
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
              </fieldset>
              <fieldset {...getFieldsetProps(fields.sortBy)}>
                <Dropdown orientation="right">
                  <Dropdown.Label>
                    <span className="lg:mv-hidden">
                      {t("filter.sortBy.label")}
                      <br />
                    </span>
                    <span className="mv-font-normal lg:mv-font-semibold">
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
                          defaultChecked={submissionSortValue === sortValue}
                          disabled={navigation.state === "loading"}
                        >
                          <FormControl.Label>
                            {t(`filter.sortBy.${sortValue}`)}
                          </FormControl.Label>
                        </FormControl>
                      );
                    })}
                  </Dropdown.List>
                </Dropdown>
              </fieldset>
            </div>
            <div className="mv-p-5 mv-max-h-full mv-flex mv-flex-col md:mv-flex-row mv-justify-between mv-gap-2 mv-border-t mv-border-gray lg:mv-hidden">
              <Link
                className="mv-grow"
                to={`${location.pathname}${
                  loaderData.submission.value.sortBy !== undefined
                    ? `?sortBy=${loaderData.submission.value.sortBy.value}-${loaderData.submission.value.sortBy.direction}`
                    : ""
                }`}
                preventScrollReset
              >
                <Button
                  variant="outline"
                  size="large"
                  loading={navigation.state === "loading"}
                  disabled={navigation.state === "loading"}
                  fullSize
                >
                  {t("filter.reset")}
                </Button>
              </Link>
              <Link
                className="mv-grow"
                to={`./${location.search
                  .replace("showFilters=on", "")
                  .replace("&&", "&")
                  .replace("?&", "?")}`}
                preventScrollReset
              >
                <Button fullSize size="large">
                  {t("showNumberOfProfiles", {
                    count: loaderData.profilesCount,
                  })}
                </Button>
              </Link>
            </div>
          </div>
          <noscript>
            <Button>{t("filter.apply")}</Button>
          </noscript>
        </Form>
      </section>
      <div className="mv-container mv-mb-4">
        <hr className="mv-border-t mv-border-gray-200 mv-mt-4" />
      </div>
      <section className="container mb-6">
        {(loaderData.selectedOffers.length > 0 ||
          loaderData.selectedAreas.length > 0) && (
          <div className="mv-flex mv-flex-col">
            {/* <Chip.Container> */}
            <div className="mv-overflow-scroll lg:mv-overflow-auto mv-flex mv-flex-nowrap lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-4">
              {loaderData.selectedOffers.map((selectedOffer) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  filter.offer.name,
                  selectedOffer.slug
                );
                return selectedOffer.title !== null ? (
                  <Chip key={selectedOffer.slug} size="medium">
                    {selectedOffer.title}
                    <Chip.Delete disabled={navigation.state === "loading"}>
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
              {loaderData.selectedAreas.map((selectedArea) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(filter.area.name, selectedArea.slug);
                return selectedArea.name !== null ? (
                  <Chip key={selectedArea.slug} size="medium">
                    {selectedArea.name}
                    <Chip.Delete disabled={navigation.state === "loading"}>
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
            {/* </Chip.Container> */}
            <Link
              to={`${location.pathname}${
                loaderData.submission.value.sortBy !== undefined
                  ? `?sortBy=${loaderData.submission.value.sortBy.value}-${loaderData.submission.value.sortBy.direction}`
                  : ""
              }`}
              preventScrollReset
            >
              <Button
                variant="outline"
                loading={navigation.state === "loading"}
                disabled={navigation.state === "loading"}
              >
                {t("filter.reset")}
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        {loaderData.filteredByVisibilityCount !== undefined &&
        loaderData.filteredByVisibilityCount > 0 ? (
          <p className="text-center text-gray-700 mb-4 mv-mx-4 md:mv-mx-0">
            {t("notShown", { count: loaderData.filteredByVisibilityCount })}
          </p>
        ) : loaderData.profilesCount > 0 ? (
          <p className="text-center text-gray-700 mb-4">
            <strong>{loaderData.profilesCount}</strong>{" "}
            {t("profilesCountSuffix", { count: loaderData.profilesCount })}
          </p>
        ) : (
          <p className="text-center text-gray-700 mb-4">{t("empty")}</p>
        )}
        {loaderData.profiles.length > 0 && (
          <>
            <CardContainer type="multi row">
              {loaderData.profiles.map((profile) => {
                return (
                  <ProfileCard
                    key={`profile-${profile.id}`}
                    publicAccess={!loaderData.isLoggedIn}
                    profile={profile}
                  />
                );
              })}
            </CardContainer>
            {loaderData.profilesCount > loaderData.profiles.length && (
              <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 md:mv-mb-24 lg:mv-mb-8 mv-mt-4 lg:mv-mt-8">
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
          </>
        )}
      </section>
    </>
  );
}
