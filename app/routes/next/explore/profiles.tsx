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
import { H1 } from "~/components/Heading/Heading";
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
    .optional(),
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
      return sortValue;
    }),
  page: z.number().optional(),
  search: z.string().optional(),
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
  if (!isLoggedIn && submission.value.filter !== undefined) {
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
      enhancedProfile =
        filterProfileByVisibility<typeof enhancedProfile>(enhancedProfile);
      // Filter organizations where profile belongs to
      enhancedProfile.memberOf = enhancedProfile.memberOf.map((relation) => {
        const filteredOrganization = filterOrganizationByVisibility<
          typeof relation.organization
        >(relation.organization);
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
    // TODO: Remove '|| area.slug === null' when slug isn't optional anymore (after migration)
    if (submission.value.filter === undefined || area.slug === null) {
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
  let selectedAreas: Array<{
    slug: string;
    name: string | null;
    vectorCount: number;
    isInSearchResultsList: boolean;
  }> = [];
  if (submission.value.filter !== undefined) {
    selectedAreas = await Promise.all(
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
  }

  const offers = await getAllOffers();
  const enhancedOffers = offers.map((offer) => {
    const vectorCount = getFilterCountForSlug(
      offer.slug,
      filterVector,
      "offer"
    );
    let isChecked;
    // TODO: Remove '|| offer.slug === null' when slug isn't optional anymore (after migration)
    if (submission.value.filter === undefined || offer.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.offer.includes(offer.slug);
    }
    return { ...offer, vectorCount, isChecked };
  });
  let selectedOffers: Array<{ slug: string; title: string | null }> = [];
  if (submission.value.filter !== undefined) {
    selectedOffers = submission.value.filter.offer.map((slug) => {
      const offerMatch = offers.find((offer) => {
        return offer.slug === slug;
      });
      return {
        slug,
        title: offerMatch?.title || null,
      };
    });
  }

  let transformedSubmission;
  if (submission.value.sortBy !== undefined) {
    transformedSubmission = {
      ...submission,
      value: {
        ...submission.value,
        sortBy: `${submission.value.sortBy.value}-${submission.value.sortBy.direction}`,
      },
    };
  } else {
    transformedSubmission = {
      ...submission,
      value: {
        ...submission.value,
        sortBy: sortValues[0],
      },
    };
  }

  return json({
    isLoggedIn,
    profiles: enhancedProfiles,
    areas: enhancedAreas,
    selectedAreas,
    offers: enhancedOffers,
    selectedOffers,
    submission: transformedSubmission,
    filteredByVisibilityCount,
    profilesCount,
  });
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const location = useLocation();
  const submit = useSubmit();
  const debounceSubmit = useDebounceSubmit();
  const { t } = useTranslation(i18nNS);

  const page = searchParams.get("page") || "1";
  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${parseInt(page) + 1}`);

  const [form, fields] = useForm<GetProfilesSchema>({
    lastResult: loaderData.submission,
    defaultValue: loaderData.submission.value,
  });

  const filter = fields.filter.getFieldset();

  const [searchQuery, setSearchQuery] = React.useState(
    loaderData.submission.value.search || ""
  );

  return (
    <>
      <section className="mv-container mv-mb-12 mv-mt-5 md:mv-mt-7 lg:mv-mt-8 mv-text-center">
        <H1 className="mv-mb-4 md:mv-mb-2 lg:mv-mb-3" like="h0">
          {t("headline")}
        </H1>
        <p>{t("intro")}</p>
      </section>

      <section className="mv-container mv-mb-12">
        <Form
          {...getFormProps(form)}
          method="get"
          onChange={(event) => {
            submit(event.currentTarget, { preventScrollReset: true });
          }}
          preventScrollReset
        >
          <input name="page" defaultValue="1" hidden />
          <div className="mv-flex mv-mb-8">
            <fieldset {...getFieldsetProps(fields.filter)} className="mv-flex">
              <div className="mv-mr-4">
                <legend className="mv-font-bold mb-2">
                  {t("filter.offers")}
                </legend>
                <ul>
                  {loaderData.offers.map((offer) => {
                    return (
                      <li key={offer.slug}>
                        <label htmlFor={filter.offer.id} className="mr-2">
                          {offer.title} ({offer.vectorCount})
                        </label>
                        <input
                          {...getInputProps(filter.offer, {
                            type: "checkbox",
                            // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                            value: offer.slug || undefined,
                          })}
                          defaultChecked={offer.isChecked}
                          disabled={
                            (offer.vectorCount === 0 && !offer.isChecked) ||
                            navigation.state === "loading"
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="mr-4">
                <legend className="font-bold mb-2">{t("filter.areas")}</legend>
                {loaderData.areas.global.map((area) => {
                  return (
                    <div key={area.slug}>
                      <label htmlFor={filter.area.id} className="mr-2">
                        {area.name} ({area.vectorCount})
                      </label>
                      <input
                        {...getInputProps(filter.area, {
                          type: "checkbox",
                          // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                          value: area.slug || undefined,
                        })}
                        defaultChecked={area.isChecked}
                        disabled={
                          (area.vectorCount === 0 && !area.isChecked) ||
                          navigation.state === "loading"
                        }
                      />
                    </div>
                  );
                })}
                {loaderData.areas.country.map((area) => {
                  return (
                    <div key={area.slug}>
                      <label htmlFor={filter.area.id} className="mr-2">
                        {area.name} ({area.vectorCount})
                      </label>
                      <input
                        {...getInputProps(filter.area, {
                          type: "checkbox",
                          // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                          value: area.slug || undefined,
                        })}
                        defaultChecked={area.isChecked}
                        disabled={
                          (area.vectorCount === 0 && !area.isChecked) ||
                          navigation.state === "loading"
                        }
                      />
                    </div>
                  );
                })}
                {loaderData.selectedAreas.length > 0 &&
                  loaderData.selectedAreas.map((selectedArea) => {
                    return selectedArea.name !== null &&
                      selectedArea.isInSearchResultsList === false ? (
                      <div key={selectedArea.slug}>
                        <label htmlFor={filter.area.id} className="mr-2">
                          {selectedArea.name} ({selectedArea.vectorCount})
                        </label>
                        <input
                          {...getInputProps(filter.area, {
                            type: "checkbox",
                            value: selectedArea.slug,
                          })}
                          defaultChecked={true}
                        />
                      </div>
                    ) : null;
                  })}
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
                {loaderData.areas.state.length > 0 && (
                  <>
                    <legend className="font-bold mt-2">
                      {t("filter.stateLabel")}
                    </legend>
                    {loaderData.areas.state.map((area) => {
                      return (
                        <div key={area.slug}>
                          <label htmlFor={filter.area.id} className="mr-2">
                            {area.name} ({area.vectorCount})
                          </label>
                          <input
                            {...getInputProps(filter.area, {
                              type: "checkbox",
                              // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                              value: area.slug || undefined,
                            })}
                            defaultChecked={area.isChecked}
                            disabled={
                              (area.vectorCount === 0 && !area.isChecked) ||
                              navigation.state === "loading"
                            }
                          />
                        </div>
                      );
                    })}
                  </>
                )}
                {loaderData.areas.district.length > 0 && (
                  <>
                    <legend className="font-bold mt-2">
                      {t("filter.districtLabel")}
                    </legend>
                    {loaderData.areas.district.map((area) => {
                      return (
                        <div key={area.slug}>
                          <label htmlFor={filter.area.id} className="mr-2">
                            {area.name} ({area.vectorCount})
                          </label>
                          <input
                            {...getInputProps(filter.area, {
                              type: "checkbox",
                              // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                              value: area.slug || undefined,
                            })}
                            defaultChecked={area.isChecked}
                            disabled={
                              (area.vectorCount === 0 && !area.isChecked) ||
                              navigation.state === "loading"
                            }
                          />
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </fieldset>
            <fieldset {...getFieldsetProps(fields.sortBy)}>
              {sortValues.map((sortValue) => {
                return (
                  <div key={sortValue}>
                    <label htmlFor={fields.sortBy.id} className="mr-2">
                      {t(`filter.sortBy.${sortValue}`)}
                    </label>
                    <input
                      {...getInputProps(fields.sortBy, {
                        type: "radio",
                        value: sortValue,
                      })}
                      defaultChecked={
                        loaderData.submission.value.sortBy === sortValue
                      }
                      disabled={navigation.state === "loading"}
                    />
                  </div>
                );
              })}
            </fieldset>
          </div>
          <noscript>
            <Button>{t("filter.apply")}</Button>
          </noscript>
        </Form>
      </section>
      <section className="container mb-6">
        {(loaderData.selectedOffers.length > 0 ||
          loaderData.selectedAreas.length > 0) && (
          <div className="flex items-center">
            <Chip.Container>
              {loaderData.selectedOffers.map((selectedOffer) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  filter.offer.name,
                  selectedOffer.slug
                );
                return selectedOffer.title !== null ? (
                  <Chip key={selectedOffer.slug} responsive>
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
                  <Chip key={selectedArea.slug} responsive>
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
            </Chip.Container>
            <Link
              to={`/explore/profiles${
                loaderData.submission.value.sortBy !== undefined
                  ? `?sortBy=${loaderData.submission.value.sortBy}`
                  : ""
              }`}
              preventScrollReset
              className="ml-2"
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
          <p className="text-center text-gray-700 mb-4">
            {loaderData.filteredByVisibilityCount} {t("notShown")}
          </p>
        ) : loaderData.profilesCount > 0 ? (
          <p className="text-center text-gray-700 mb-4">
            <strong>{loaderData.profilesCount}</strong>{" "}
            {t("profilesCountSuffix")}
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
