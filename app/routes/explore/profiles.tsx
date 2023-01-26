import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
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
import { H1, H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import { createAreaOptionFromData } from "~/lib/utils/components";
import { getAllOffers } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import {
  getAllProfiles,
  getFilterValues,
  getPaginationValues,
} from "./utils.server";

type LoaderData = {
  isLoggedIn: boolean;
  profiles: Awaited<ReturnType<typeof getAllProfiles>>;
  areas: Awaited<ReturnType<typeof getAreas>>;
  offers: Awaited<ReturnType<typeof getAllOffers>>;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  const isLoggedIn = sessionUser !== null;

  const paginationValues = getPaginationValues(request);
  const filterValues = isLoggedIn
    ? getFilterValues(request)
    : { areaId: undefined, offerId: undefined, seekingId: undefined };

  let profiles;

  const allProfiles = await getAllProfiles({
    ...paginationValues,
    ...filterValues,
  });

  if (allProfiles !== null) {
    profiles = allProfiles.map((profile) => {
      const { bio, position, avatar, publicFields, ...otherFields } = profile;
      let extensions: { bio?: string; position?: string } = {};

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

      let avatarImage: string | null = null;

      if (avatar !== null) {
        const publicURL = getPublicURL(authClient, avatar);
        if (publicURL !== null) {
          avatarImage = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }

      return { ...otherFields, ...extensions, avatar: avatarImage };
    });
  }

  const areas = await getAreas();
  const offers = await getAllOffers();

  // TODO: fix type issue
  return json<LoaderData>(
    { isLoggedIn, profiles, areas, offers },
    { headers: response.headers }
  );
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
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
    "/explore/profiles",
    "profiles",
    searchParams
  );

  return (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Entdecke die Community</H1>
        <p className="">
          Hier findest du die Profile von Akteur:innen der MINT-Community.
        </p>
      </section>

      {loaderData.isLoggedIn ? (
        <section className="container my-8">
          <Form
            method="get"
            onChange={(event: React.FormEvent<HTMLFormElement>) => {
              event.stopPropagation();
              const submitButton: HTMLButtonElement | null =
                event.currentTarget.querySelector("#submitButton");
              if (submitButton !== null) {
                submitButton.click();
              }
            }}
            reloadDocument
          >
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
              <button
                id="submitButton"
                type="submit"
                className="hidden"
              ></button>
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
        className="container my-8 md:my-10 lg:my-20"
        id="contact-details"
      >
        <div
          data-testid="grid"
          className="flex flex-wrap justify-center -mx-4 items-stretch"
        >
          {items.length > 0 ? (
            items.map((profile) => {
              let slug, image, initials, name, subtitle;
              slug = `/profile/${profile.username}`;
              image = profile.avatar;
              initials = getInitials(profile);
              name = getFullName(profile);
              subtitle = profile.position;
              return (
                <div
                  key={`profile-${profile.id}`}
                  data-testid="gridcell"
                  className="flex-100 md:flex-1/2 lg:flex-1/3 px-4 lg:px-4 mb-8"
                >
                  <Link
                    to={slug}
                    className="flex flex-wrap content-start items-start px-4 pt-4 lg:p-6 pb-8 rounded-3xl shadow h-full bg-neutral-200 hover:bg-neutral-400"
                  >
                    <div className="w-full flex flex-row">
                      <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                        {image !== null ? <img src={image} alt="" /> : initials}
                      </div>
                      <div className="pl-4">
                        <H3 like="h4" className="text-xl mb-1">
                          {name}
                        </H3>
                        {subtitle !== null ? (
                          <p className="font-bold text-sm">{subtitle}</p>
                        ) : null}
                      </div>
                    </div>

                    {profile.bio !== undefined ? (
                      <p className="mt-3 line-clamp-2">{profile.bio}</p>
                    ) : null}

                    {profile.areaNames.length > 0 ? (
                      <div className="flex font-semibold flex-col lg:flex-row w-full mt-3">
                        <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                          Aktivitätsgebiete
                        </div>
                        <div className="flex-auto line-clamp-3">
                          <span>{profile.areaNames.join(" / ")}</span>
                        </div>
                      </div>
                    ) : null}
                  </Link>
                </div>
              );
            })
          ) : (
            <p>
              Für Deine Filterkriterien konnten leider keine Profile gefunden
              werden.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
