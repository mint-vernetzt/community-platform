import { Button, CardContainer, ProfileCard } from "@mint-vernetzt/components";
import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import React from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { createAreaOptionFromData } from "~/lib/utils/components";
import { prismaClient } from "~/prisma.server";
import { getAllOffers } from "~/profile.server";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
} from "~/public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import {
  getAllProfiles,
  getFilterValues,
  getPaginationValues,
  getRandomSeed,
} from "./utils.server";
// import styles from "../../../common/design/styles/styles.css";

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  const isLoggedIn = sessionUser !== null;

  const { skip, take, page, itemsPerPage } = getPaginationValues(request);
  const filterValues = isLoggedIn
    ? getFilterValues(request)
    : { areaId: undefined, offerId: undefined, seekingId: undefined };

  let randomSeed = getRandomSeed(request);
  if (randomSeed === undefined) {
    randomSeed = parseFloat(Math.random().toFixed(3));
    return redirect(
      `/explore/profiles?randomSeed=${randomSeed}${
        filterValues.areaId ? `&areaId=${filterValues.areaId}` : ""
      }${filterValues.offerId ? `&offerId=${filterValues.offerId}` : ""}${
        filterValues.seekingId ? `&seekingId=${filterValues.seekingId}` : ""
      }`,
      {
        headers: response.headers,
      }
    );
  }

  const rawProfiles = await getAllProfiles({
    skip,
    take,
    ...filterValues,
    randomSeed,
  });

  const enhancedProfiles = [];

  for (const profile of rawProfiles) {
    let enhancedProfile = {
      ...profile,
      memberOf: await prismaClient.organization.findMany({
        where: {
          teamMembers: {
            some: {
              profileId: profile.id,
            },
          },
        },
        select: {
          name: true,
          slug: true,
          logo: true,
          id: true,
        },
      }),
    };

    if (sessionUser === null) {
      // Filter profile
      enhancedProfile = await filterProfileByVisibility<typeof enhancedProfile>(
        enhancedProfile
      );
      // Filter organizations where profile belongs to
      enhancedProfile.memberOf = await Promise.all(
        enhancedProfile.memberOf.map(async (organization) => {
          const filteredOrganization = await filterOrganizationByVisibility<
            typeof organization
          >(organization);
          return { ...filteredOrganization };
        })
      );
    }

    // Add images from image proxy
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

    enhancedProfile.memberOf = enhancedProfile.memberOf.map((organization) => {
      let logo = organization.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
        });
      }
      return { ...organization, logo };
    });

    enhancedProfiles.push(enhancedProfile);
  }

  const areas = await getAreas();
  const offers = await getAllOffers();

  return json(
    {
      isLoggedIn,
      profiles: enhancedProfiles,
      areas,
      offers,
      pagination: { page, itemsPerPage },
    },
    { headers: response.headers }
  );
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
  const submit = useSubmit();
  const areaOptions = createAreaOptionFromData(loaderData.areas);

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
    setPage(1);
  }, [loaderData.profiles]);

  function handleChange(event: React.FormEvent<HTMLFormElement>) {
    submit(event.currentTarget);
  }

  return (
    <>
      <section className="container my-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Entdecke die Community</H1>
        <p className="">
          Hier findest du die Profile von Akteur:innen der MINT-Community.
        </p>
      </section>

      {loaderData.isLoggedIn ? (
        <section className="container mb-8">
          <Form method="get" onChange={handleChange} reloadDocument>
            <input
              hidden
              name="randomSeed"
              value={searchParams.get("randomSeed") ?? ""}
              readOnly
            />
            <input hidden name="page" value={1} readOnly />
            <div className="flex flex-wrap -mx-4">
              <div className="form-control px-4 pb-4 flex-initial w-full md:w-1/3">
                <label className="block font-semibold mb-2">
                  Aktivitätsgebiet
                </label>
                <select
                  id="areaId"
                  name="areaId"
                  defaultValue={areaId || undefined}
                  className="select w-full select-bordered"
                >
                  <option></option>
                  {areaOptions.map((option, index) => (
                    <React.Fragment key={index}>
                      {"value" in option ? (
                        <option key={`area-${index}`} value={option.value}>
                          {option.label}
                        </option>
                      ) : null}

                      {"options" in option ? (
                        <optgroup
                          key={`area-group-${index}`}
                          label={option.label}
                        >
                          {option.options.map(
                            (groupOption, groupOptionIndex) => (
                              <option
                                key={`area-${index}-${groupOptionIndex}`}
                                value={groupOption.value}
                              >
                                {groupOption.label}
                              </option>
                            )
                          )}
                        </optgroup>
                      ) : null}
                    </React.Fragment>
                  ))}
                </select>
              </div>
              <div className="form-control px-4 pb-4 flex-initial w-full md:w-1/3">
                <label className="block font-semibold mb-2">Ich suche</label>
                <select
                  id="offerId"
                  name="offerId"
                  defaultValue={offerId || undefined}
                  className="select w-full select-bordered"
                >
                  <option></option>
                  {loaderData.offers.map((offer) => (
                    <option key={`offer-${offer.id}`} value={offer.id}>
                      {offer.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control px-4 pb-4 flex-initial w-full md:w-1/3">
                <label className="block font-semibold mb-2">
                  Ich möchte unterstützen mit
                </label>
                <select
                  id="seekingId"
                  name="seekingId"
                  defaultValue={seekingId || undefined}
                  className="select w-full select-bordered"
                >
                  <option></option>
                  {loaderData.offers.map((offer) => (
                    <option key={`seeking-${offer.id}`} value={offer.id}>
                      {offer.title}
                    </option>
                  ))}
                </select>
              </div>
              <input hidden name="page" defaultValue={1} readOnly />
            </div>
            <div className="flex justify-end">
              <noscript>
                <button
                  id="noScriptSubmitButton"
                  type="submit"
                  className="btn btn-primary mr-2"
                >
                  Filter anwenden
                </button>
              </noscript>
              <Link to={"./"} reloadDocument>
                <div
                  className={`btn btn-primary btn-outline ${
                    areaId === null && offerId === null && seekingId === null
                      ? "hidden"
                      : ""
                  }`}
                >
                  Filter zurücksetzen
                </div>
              </Link>
            </div>
          </Form>
        </section>
      ) : null}

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
              <div className="mv-w-full mv-flex mv-justify-center pb-4 md:pb-0">
                <fetcher.Form method="get">
                  <input
                    key="randomSeed"
                    type="hidden"
                    name="randomSeed"
                    value={searchParams.get("randomSeed") ?? ""}
                  />
                  <input
                    key="page"
                    type="hidden"
                    name="page"
                    value={page + 1}
                  />
                  <input
                    key="areaId"
                    type="hidden"
                    name="areaId"
                    value={areaId ?? ""}
                  />
                  <input
                    key="offerId"
                    type="hidden"
                    name="offerId"
                    value={offerId ?? ""}
                  />
                  <input
                    key="seekingId"
                    type="hidden"
                    name="seekingId"
                    value={seekingId ?? ""}
                  />
                  <Button
                    size="large"
                    variant="outline"
                    loading={fetcher.state === "submitting"}
                  >
                    Weitere laden
                  </Button>
                </fetcher.Form>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-primary">
            Für Deine Filterkriterien konnten leider keine Profile gefunden
            werden.
          </p>
        )}
      </section>
    </>
  );
}
