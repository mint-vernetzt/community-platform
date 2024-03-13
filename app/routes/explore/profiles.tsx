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
import { json } from "@remix-run/node";
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
import { getAllOffers } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import {
  getAllProfiles,
  getAreaNameBySlug,
  getAreasBySearchQuery,
  getProfileFilterVector,
  getProfilesCount,
  getTakeParam,
  getVisibilityFilteredProfilesCount,
} from "./profiles.server";
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
      area: z.string().optional(),
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
  const groupedAreas = {
    global: [] as Awaited<ReturnType<typeof getAreasBySearchQuery>>,
    country: [] as Awaited<ReturnType<typeof getAreasBySearchQuery>>,
    state: [] as Awaited<ReturnType<typeof getAreasBySearchQuery>>,
    district: [] as Awaited<ReturnType<typeof getAreasBySearchQuery>>,
  };
  for (const area of areas) {
    groupedAreas[area.type].push(area);
  }
  const selectedAreaSlug = submission.value.filter?.area;
  let selectedAreaName;
  if (selectedAreaSlug !== undefined) {
    selectedAreaName = await getAreaNameBySlug(selectedAreaSlug);
  }

  const offers = await getAllOffers();

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
    areas: groupedAreas,
    selectedArea: {
      slug: selectedAreaSlug,
      name: selectedAreaName,
    },
    offers,
    submission: transformedSubmission,
    filterVector,
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
  const selectedOffers = filter.offer.getFieldList();

  let deleteAreaSearchParams;
  if (loaderData.selectedArea.slug !== undefined) {
    deleteAreaSearchParams = new URLSearchParams(searchParams);
    deleteAreaSearchParams.delete(
      filter.area.name,
      loaderData.selectedArea.slug
    );
  }

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
                <div className="mv-flex mv-min-h-10 mv-w-max mv-max-w-fit mv-py-2 mv-px-4 mv-items-center mv-gap-2 mv-rounded-lg mv-bg-gray-100">
                  <legend>
                    <label
                      htmlFor="offer-filter"
                      className="mv-appearance-none mv-text-gray-700 mv-font-bold"
                    >
                      {t("filter.offers")}
                    </label>
                  </legend>
                  <input
                    id="offer-filter"
                    type="checkbox"
                    onChange={(event) => {
                      event.stopPropagation();
                    }}
                    // className="appearance-none"
                  />
                  {/* TODO: svg with absolute position */}
                </div>
                <div className="mv-p-2 mv-rounded-lg mv-shadow-2xl">
                  <ul className="mv-w-full mv-overflow-y-auto mv-w-[300px] mv-max-h-[360px] mv-absolute mv-z-10">
                    {loaderData.offers.map((offer) => {
                      const offerVector = loaderData.filterVector.find(
                        (vector) => {
                          return vector.attr === "offer";
                        }
                      );
                      // TODO: Remove '|| ""' when slug isn't optional anymore (after migration)
                      const offerIndex =
                        offerVector !== undefined
                          ? offerVector.value.indexOf(offer.slug || "")
                          : 0;
                      const offerCount =
                        offerVector !== undefined
                          ? offerVector.count.at(offerIndex)
                          : 0;
                      return (
                        <li key={offer.slug}>
                          <label htmlFor={filter.offer.id} className="mr-2">
                            {offer.title} ({offerCount})
                          </label>
                          <input
                            {...getInputProps(filter.offer, {
                              type: "checkbox",
                              // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                              value: offer.slug || undefined,
                            })}
                            defaultChecked={selectedOffers.some(
                              (selectedOffer) => {
                                return selectedOffer.value === offer.slug;
                              }
                            )}
                            disabled={
                              offerCount === 0 || navigation.state === "loading"
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="mr-4">
                <legend className="font-bold mb-2">{t("filter.areas")}</legend>
                {loaderData.areas.global.map((area) => {
                  return (
                    <div key={area.slug}>
                      <label htmlFor={filter.area.id} className="mr-2">
                        {area.name}
                      </label>
                      <input
                        {...getInputProps(filter.area, {
                          type: "radio",
                          // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                          value: area.slug || undefined,
                        })}
                        defaultChecked={
                          loaderData.selectedArea.slug === area.slug
                        }
                        disabled={navigation.state === "loading"}
                      />
                    </div>
                  );
                })}
                {loaderData.areas.country.map((area) => {
                  return (
                    <div key={area.slug}>
                      <label htmlFor={filter.area.id} className="mr-2">
                        {area.name}
                      </label>
                      <input
                        {...getInputProps(filter.area, {
                          type: "radio",
                          // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                          value: area.slug || undefined,
                        })}
                        defaultChecked={
                          loaderData.selectedArea.slug === area.slug
                        }
                        disabled={navigation.state === "loading"}
                      />
                    </div>
                  );
                })}
                {loaderData.selectedArea.slug !== undefined &&
                  loaderData.selectedArea.name !== undefined &&
                  loaderData.areas.global.some((area) => {
                    return area.slug === loaderData.selectedArea.slug;
                  }) === false &&
                  loaderData.areas.country.some((area) => {
                    return area.slug === loaderData.selectedArea.slug;
                  }) === false &&
                  loaderData.areas.state.some((area) => {
                    return area.slug === loaderData.selectedArea.slug;
                  }) === false &&
                  loaderData.areas.district.some((area) => {
                    return area.slug === loaderData.selectedArea.slug;
                  }) === false && (
                    // TODO: Should this be hidden?
                    <>
                      <label htmlFor={filter.area.id} className="mr-2">
                        {loaderData.selectedArea.name}
                      </label>
                      <input
                        {...getInputProps(filter.area, {
                          type: "radio",
                          value: loaderData.selectedArea.slug,
                        })}
                        defaultChecked={true}
                      />
                    </>
                  )}
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
                            {area.name}
                          </label>
                          <input
                            {...getInputProps(filter.area, {
                              type: "radio",
                              // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                              value: area.slug || undefined,
                            })}
                            defaultChecked={
                              loaderData.selectedArea.slug === area.slug
                            }
                            disabled={navigation.state === "loading"}
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
                            {area.name}
                          </label>
                          <input
                            {...getInputProps(filter.area, {
                              type: "radio",
                              // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                              value: area.slug || undefined,
                            })}
                            defaultChecked={
                              loaderData.selectedArea.slug === area.slug
                            }
                            disabled={navigation.state === "loading"}
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
        {(selectedOffers.length > 0 ||
          (loaderData.submission.value.filter !== undefined &&
            loaderData.submission.value.filter.area !== undefined)) && (
          <div className="flex items-center">
            <Chip.Container>
              {selectedOffers.map((selectedOffer) => {
                const offerMatch = loaderData.offers.filter((offer) => {
                  return offer.slug === selectedOffer.value;
                });
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  filter.offer.name,
                  selectedOffer.value
                );
                return offerMatch[0] !== undefined &&
                  selectedOffer.value !== undefined ? (
                  <Chip key={selectedOffer.key} responsive>
                    {offerMatch[0].title}
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
              {loaderData.selectedArea.slug !== undefined &&
                loaderData.selectedArea.name !== undefined &&
                deleteAreaSearchParams !== undefined && (
                  <Chip key={loaderData.selectedArea.slug} responsive>
                    {loaderData.selectedArea.name}
                    <Chip.Delete disabled={navigation.state === "loading"}>
                      <Link
                        to={`${
                          location.pathname
                        }?${deleteAreaSearchParams.toString()}`}
                        preventScrollReset
                      >
                        X
                      </Link>
                    </Chip.Delete>
                  </Chip>
                )}
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
