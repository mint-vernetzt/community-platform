import { getFieldsetProps, getFormProps, useForm } from "@conform-to/react-v1";
import { parseWithZod } from "@conform-to/zod-v1";
import { Button, CardContainer, ProfileCard } from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
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
  getPaginationOptions,
  getProfileFilterVector,
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
  const pagination = getPaginationOptions(submission.value.page);
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  const profiles = await getAllProfiles({
    pagination,
    filter: submission.value.filter,
    sortBy: submission.value.sortBy,
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

  // TODO: How to handle profile visibility with filter vector?
  // Joining profileVisibilities and formulate where clause for each filter field on anon (f.e. profileVisibility: { areas: true })
  const filterVector = await getProfileFilterVector({
    filter: submission.value.filter,
  });
  console.log(filterVector);

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
    transformedSubmission = submission;
  }

  return json({
    isLoggedIn,
    profiles: enhancedProfiles,
    areas,
    offers,
    pagination: {
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
    },
    submission: transformedSubmission,
    filterVector,
  });
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof loader>();
  const [searchParams] = useSearchParams();
  const [items, setItems] = React.useState(loaderData.profiles);
  const [shouldFetch, setShouldFetch] = React.useState(() => {
    if (loaderData.profiles.length < loaderData.pagination.itemsPerPage) {
      return false;
    }
    return true;
  });
  const [page, setPage] = React.useState(() => {
    const pageParam = searchParams.get("page");
    if (pageParam !== null) {
      return parseInt(pageParam);
    }
    return 1;
  });
  const areaId = searchParams.get("areaId");
  const offerId = searchParams.get("offerId");
  const seekingId = searchParams.get("seekingId");
  const sortBy = searchParams.get("sortBy");

  React.useEffect(() => {
    if (fetcher.data !== undefined) {
      setItems((profiles) => {
        return fetcher.data !== undefined
          ? [...profiles, ...fetcher.data.profiles]
          : [...profiles];
      });
      setPage(fetcher.data.pagination.page);
      if (fetcher.data.profiles.length < fetcher.data.pagination.itemsPerPage) {
        setShouldFetch(false);
      }
    }
  }, [fetcher.data]);

  React.useEffect(() => {
    setItems(loaderData.profiles);

    if (loaderData.profiles.length < loaderData.pagination.itemsPerPage) {
      setShouldFetch(false);
    } else {
      setShouldFetch(true);
    }
    // setPage(1);
  }, [loaderData.profiles, loaderData.pagination.itemsPerPage]);

  const { t } = useTranslation(i18nNS);

  const [form, fields] = useForm<GetProfilesSchema>({
    lastResult: loaderData.submission,
    defaultValue: {
      filter: loaderData.submission.value.filter,
      sortBy: loaderData.submission.value.sortBy || sortValues[0],
    },
  });

  const filter = fields.filter.getFieldset();
  const selectedOffers = filter.offer.getFieldList();

  const submit = useSubmit();
  function handleChange(event: React.FormEvent<HTMLFormElement>) {
    submit(event.currentTarget);
  }

  return (
    <>
      <section className="container my-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">{t("headline")}</H1>
        <p className="">{t("intro")}</p>
      </section>

      <section className="container mb-8">
        <Form
          method="get"
          onChange={handleChange}
          // TODO: This does not work yet
          preventScrollReset
          {...getFormProps(form)}
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
                  const offerIndex = offerVector?.value.indexOf(
                    offer.slug || ""
                  );
                  const offerCount = offerVector?.count.at(offerIndex || 0);
                  return (
                    <li key={offer.id}>
                      <label className="mr-2">
                        {offer.title} ({offerCount})
                      </label>
                      <input
                        name={filter.offer.name}
                        type="checkbox"
                        defaultValue={offer.slug || undefined} // TODO: Remove undefined when migration is fully applied and slug cannot be null anymore
                        defaultChecked={selectedOffers.some((selectedOffer) => {
                          return selectedOffer.value === offer.slug;
                        })}
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
                      <label className="mr-2">{sortValue}</label>
                      <input
                        name={fields.sortBy.name}
                        type="radio"
                        defaultValue={sortValue}
                        defaultChecked={
                          loaderData.submission.value.sortBy === sortValue ||
                          sortValues[0] === sortValue
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </div>
          <noscript>
            <button type="submit">Filter anwenden</button>
          </noscript>
        </Form>
        {selectedOffers.length > 0 && (
          <>
            <p className="font-bold mb-2">Ausgewählte Filter</p>
            <Form
              method="get"
              onChange={handleChange}
              className="mb-2"
              // TODO: This does not work yet
              preventScrollReset
              {...getFormProps(form)}
            >
              {/* <Chip.Container> */}
              <ul>
                {selectedOffers.map((selectedOffer, index) => {
                  const offerMatch = loaderData.offers.filter((offer) => {
                    return offer.slug === selectedOffer.value;
                  });
                  return offerMatch[0] !== undefined ? (
                    <li key={selectedOffer.value}>
                      <label className="mr-2">{offerMatch[0].title}</label>
                      <input
                        name={filter.offer.name}
                        type="checkbox"
                        defaultValue={selectedOffer.value}
                        defaultChecked={true}
                      />
                    </li>
                  ) : null;
                  // <Chip key={selectedOffer.key}>
                  //   {offerMatch[0].title}
                  //   {/* TODO: This throws an error because the submission.status gets undefined,
                  //             which is kind of a hustle because then the submission.value field is missing */}
                  //   {/* <Chip.Delete>
                  //     <button
                  //       {...form.remove.getButtonProps({
                  //         name: filter.offer.name,
                  //         index,
                  //       })}
                  //     />
                  //   </Chip.Delete> */}
                  //   {/* Workarround try: New Form with the Chips and a checkbox input for each offer to delete it (defaultChecked: true) */}
                  //   {/* Note: This still has an issue as the Chip.Delete Component tries to add children to the input element (svg icon) */}
                  //   <Chip.Delete>
                  //     <input
                  //       name={filter.offer.name}
                  //       type="checkbox"
                  //       defaultValue={selectedOffer.value}
                  //       defaultChecked={true}
                  //     />
                  //   </Chip.Delete>
                  // </Chip>
                })}
              </ul>
              {/* </Chip.Container> */}
            </Form>
            <Link
              to={`/explore/profiles${
                loaderData.submission.value.sortBy !== undefined
                  ? `?sortBy=${loaderData.submission.value.sortBy}`
                  : ""
              }`}
              preventScrollReset
            >
              Alles zurücksetzen
            </Link>
          </>
        )}
      </section>

      <section className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        {items.length > 0 ? (
          <>
            <CardContainer type="multi row">
              {items.map((profile) => {
                return (
                  <ProfileCard
                    key={`profile-${profile.id}`}
                    publicAccess={!loaderData.isLoggedIn}
                    profile={profile}
                  />
                );
              })}
            </CardContainer>
            {shouldFetch && (
              <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 md:mv-mb-24 lg:mv-mb-8 mv-mt-4 lg:mv-mt-8">
                <fetcher.Form method="get">
                  <input
                    key="page"
                    type="hidden"
                    name="page"
                    defaultValue={page + 1}
                  />
                  <input
                    key="areaId"
                    type="hidden"
                    name="areaId"
                    defaultValue={areaId ?? ""}
                  />
                  <input
                    key="offerId"
                    type="hidden"
                    name="offerId"
                    defaultValue={offerId ?? ""}
                  />
                  <input
                    key="seekingId"
                    type="hidden"
                    name="seekingId"
                    defaultValue={seekingId ?? ""}
                  />
                  <input
                    key="sortBy"
                    type="hidden"
                    name="sortBy"
                    defaultValue={sortBy ?? "firstNameAsc"}
                  />
                  <Button
                    size="large"
                    variant="outline"
                    loading={fetcher.state === "loading"}
                  >
                    {t("more")}
                  </Button>
                </fetcher.Form>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-primary">
            {loaderData.isLoggedIn ? t("empty") : t("emptyOrFiltered")}
          </p>
        )}
      </section>
    </>
  );
}
