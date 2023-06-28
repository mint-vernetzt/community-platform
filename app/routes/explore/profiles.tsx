import { CardContainer, ProfileCard } from "@mint-vernetzt/components";
import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import React from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
import { createAreaOptionFromData } from "~/lib/utils/components";
import { prismaClient } from "~/prisma";
import { getAllOffers } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import {
  getAllProfiles,
  getFilterValues,
  getPaginationValues,
  getRandomSeed,
} from "./utils.server";

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  const isLoggedIn = sessionUser !== null;

  const paginationValues = getPaginationValues(request);
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
    ...paginationValues,
    ...filterValues,
    randomSeed,
  });

  const profiles = await Promise.all(
    rawProfiles.map(async (profile) => {
      const {
        bio,
        position,
        avatar,
        background,
        publicFields,
        offers,
        ...otherFields
      } = profile;
      let extensions: {
        bio?: string;
        position?: string;
        memberOf: { name: string; slug: string; logo?: string | null }[];
        offers: string[];
      } = { memberOf: [], offers: [] };

      if (
        ((publicFields !== null && publicFields.includes("bio")) ||
          sessionUser !== null) &&
        bio !== null
      ) {
        extensions.bio = bio;
      }
      if (
        ((publicFields !== null && publicFields.includes("position")) ||
          sessionUser !== null) &&
        position !== null
      ) {
        extensions.position = position;
      }
      if (
        ((publicFields !== null && publicFields.includes("offers")) ||
          sessionUser !== null) &&
        offers !== null
      ) {
        extensions.offers = offers;
      }

      let avatarImage: string | null = null;

      if (avatar !== null) {
        const publicURL = getPublicURL(authClient, avatar);
        if (publicURL !== null) {
          avatarImage = getImageURL(publicURL, {
            resize: { type: "fill", width: 136, height: 136 },
            gravity: GravityType.center,
          });
        }
      }

      let backgroundImage: string | null = null;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL !== null) {
          backgroundImage = getImageURL(publicURL, {
            resize: { type: "fit", width: 473, height: 160 },
          });
        }
      }

      const organizations = await prismaClient.organization.findMany({
        where: {
          teamMembers: {
            some: {
              profileId: profile.id,
            },
          },
        },
      });
      extensions.memberOf = organizations.map((organization) => {
        let logoImage: string | null = null;
        if (organization.logo !== null) {
          const publicURL = getPublicURL(authClient, organization.logo);
          if (publicURL !== null) {
            logoImage = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }

        return {
          name: organization.name,
          slug: organization.slug,
          logo: logoImage,
        };
      });

      return {
        ...otherFields,
        ...extensions,
        avatar: avatarImage,
        background: backgroundImage,
      };
    })
  );

  const areas = await getAreas();
  const offers = await getAllOffers();

  return json(
    { isLoggedIn, profiles, areas, offers },
    { headers: response.headers }
  );
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();

  const [searchParams] = useSearchParams();
  const areaId = searchParams.get("areaId");
  const offerId = searchParams.get("offerId");
  const seekingId = searchParams.get("seekingId");
  const submit = useSubmit();
  const areaOptions = createAreaOptionFromData(loaderData.areas);
  const {
    items,
    refCallback,
  }: {
    items: typeof loaderData.profiles;
    refCallback: (node: HTMLDivElement) => void;
  } = useInfiniteItems(
    loaderData.profiles,
    "/explore/profiles?",
    "profiles",
    searchParams
  );

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
      <section
        ref={refCallback}
        className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl"
      >
        <CardContainer type="multi row">
          {items.length > 0 ? (
            items.map((profile) => {
              return (
                <ProfileCard
                  key={`profile-${profile.id}`}
                  publicAccess={!loaderData.isLoggedIn}
                  profile={profile}
                />
              );
            })
          ) : (
            <p>
              Für Deine Filterkriterien konnten leider keine Profile gefunden
              werden.
            </p>
          )}
        </CardContainer>
      </section>
    </>
  );
}
