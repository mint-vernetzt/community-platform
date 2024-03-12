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
import { getAreas } from "~/utils.server";
import {
  getAllProfiles,
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

  const areas = await getAreas();
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
    areas,
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
  const { t } = useTranslation(i18nNS);

  const page = searchParams.get("page") || "1";
  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${parseInt(page) + 1}`);

  const [form, fields] = useForm<GetProfilesSchema>({
    lastResult: loaderData.submission,
    defaultValue: {
      filter: loaderData.submission.value.filter,
      sortBy: loaderData.submission.value.sortBy,
    },
  });

  const filter = fields.filter.getFieldset();
  const selectedOffers = filter.offer.getFieldList();

  function handleChange(event: React.FormEvent<HTMLFormElement>) {
    submit(event.currentTarget, { preventScrollReset: true });
  }

  return (
    <>
      <section className="container my-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">{t("headline")}</H1>
        <p className="">{t("intro")}</p>
      </section>

      <section className="container mb-8">
        <Form
          {...getFormProps(form)}
          method="get"
          onChange={handleChange}
          preventScrollReset
        >
          <input name="page" defaultValue="1" hidden />
          <div className="flex mb-8">
            <fieldset {...getFieldsetProps(fields.filter)}>
              <legend className="font-bold mb-2">Angebotene Kompetenzen</legend>
              <ul>
                {loaderData.offers.map((offer) => {
                  const offerVector = loaderData.filterVector.find((vector) => {
                    return vector.attr === "offer";
                  });
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
                        defaultChecked={selectedOffers.some((selectedOffer) => {
                          return selectedOffer.value === offer.slug;
                        })}
                        disabled={
                          offerCount === 0 || navigation.state === "loading"
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </fieldset>
            <fieldset {...getFieldsetProps(fields.sortBy)}>
              <legend className="font-bold mb-2">Sortierung</legend>
              <ul>
                {sortValues.map((sortValue) => {
                  return (
                    <li key={sortValue}>
                      <label htmlFor={fields.sortBy.id} className="mr-2">
                        {sortValue}
                      </label>
                      <input
                        {...getInputProps(fields.sortBy, {
                          type: "radio",
                          value: sortValue,
                        })}
                        defaultChecked={
                          loaderData.submission.value.sortBy === sortValue ||
                          sortValues[0] === sortValue
                        }
                        disabled={navigation.state === "loading"}
                      />
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </div>
          <noscript>
            <Button>Filter anwenden</Button>
          </noscript>
        </Form>
      </section>
      <section className="container mb-8">
        {selectedOffers.length > 0 && (
          <>
            <div className="mb-2">
              <p className="font-bold mb-2">Ausgewählte Filter</p>
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
                  return offerMatch[0] !== undefined ? (
                    <Chip key={selectedOffer.key}>
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
              </Chip.Container>
            </div>
            <Link
              to={`/explore/profiles${
                loaderData.submission.value.sortBy !== undefined
                  ? `?sortBy=${loaderData.submission.value.sortBy}`
                  : ""
              }`}
              preventScrollReset
            >
              <Button
                variant="outline"
                loading={navigation.state === "loading"}
                disabled={navigation.state === "loading"}
              >
                Alles zurücksetzen
              </Button>
            </Link>
          </>
        )}
      </section>

      <section className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        {loaderData.filteredByVisibilityCount !== undefined &&
          loaderData.filteredByVisibilityCount > 0 && (
            <p className="text-center text-primary mb-8">
              {loaderData.filteredByVisibilityCount} {t("notShown")}
            </p>
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
        {loaderData.profiles.length === 0 &&
          (loaderData.filteredByVisibilityCount === undefined ||
            loaderData.filteredByVisibilityCount === 0) && (
            <p className="text-center text-primary">{t("empty")}</p>
          )}
      </section>
    </>
  );
}
