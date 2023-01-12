import type { Area } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import type { FormEvent } from "react";
import React from "react";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1, H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import { createAreaOptionFromData } from "~/lib/utils/components";
import {
  getAllOffers,
  getAreaById,
  getFilteredProfiles,
} from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import { getAllProfiles } from "./utils.server";

const schema = z.object({
  areaId: z.string().optional(),
  offerId: z.string().optional(),
  seekingId: z.string().optional(),
});

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

type Profiles = Awaited<ReturnType<typeof getAllProfiles>>;

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

  let profiles;

  const allProfiles = await getAllProfiles();
  if (allProfiles !== null) {
    profiles = allProfiles.map((profile) => {
      const { bio, position, avatar, publicFields, ...otherFields } = profile;
      let extensions: { bio?: string; position?: string } = {};

      if (
        (publicFields.includes("bio") || sessionUser !== null) &&
        bio !== null
      ) {
        extensions.bio = bio;
      }
      if (
        (publicFields.includes("position") || sessionUser !== null) &&
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

function getCompareValues(
  a: { firstName: string } | { name: string },
  b: { firstName: string } | { name: string }
) {
  let compareValues: { a: string; b: string } = { a: "", b: "" };

  if ("firstName" in a) {
    compareValues.a = a.firstName;
  } else {
    compareValues.a = a.name;
  }
  if ("firstName" in b) {
    compareValues.b = b.firstName;
  } else {
    compareValues.b = b.name;
  }

  return compareValues;
}

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (!(values.areaId || values.offerId || values.seekingId)) {
    throw "";
  }

  let areaToFilter: Pick<Area, "id" | "type" | "stateId"> | null | undefined;
  if (values.areaId !== undefined) {
    areaToFilter = await getAreaById(values.areaId);
  }

  let filteredProfiles = await getFilteredProfiles(
    areaToFilter,
    values.offerId,
    values.seekingId
  );

  // TODO: Outsource profile sorting (to database?) inside loader with url params

  let sortedProfiles;
  if (areaToFilter) {
    // Explanation of the below sorting code:
    //
    // Expected sorting when filtering for country ("Bundesweit"):
    // 1. All profiles with a country
    // 2. All remaining profiles with a state
    // 3. All remaining profiles with a district
    //
    // Expected sorting when filtering for state ("Sachsen", "Saarland", etc...):
    // 1. All profiles with exactly the filtered state
    // 2. All remaining profiles with districts inside the filtered state
    // 3. All remaining profiles with a country
    //
    // Expected sorting when filtering for district ("Berlin", "Hamburg", etc...):
    // 1. All profiles with exactly the filtered district
    // 2. All remaining profiles with a state that includes the district
    // 3. All remaining profiles with a country
    //
    // To achieve this:
    // 1. Group the filteredProfiles in ProfilesWithCountry, ProfilesWithState, ProfilesWithDistrict
    // 2. Sort them alphabetical
    // 3. Append the groups together getting the order described above
    // 3.1. Profiles can have more than one area, which leads to the possibility that they got fetched from the database
    //      because they have a country ("Bundesweit") but also have a state or district the user did not filter for.
    //      Therefore another filter method is applied filtering out all profiles with the exact state or district.
    // 4. Step 1. and 3. leads to duplicate Profile entries. To exclude them the Array is transformed to a Set and vice versa.

    // 1.
    const profilesWithCountry = filteredProfiles
      .filter((item) => item.areas.some((area) => area.area.type === "country"))
      // 2.
      .sort((a, b) => {
        let compareValues = getCompareValues(a, b);
        return compareValues.a.localeCompare(compareValues.b);
      });
    const profilesWithState = filteredProfiles
      .filter((item) => item.areas.some((area) => area.area.type === "state"))
      .sort((a, b) => {
        let compareValues = getCompareValues(a, b);
        return compareValues.a.localeCompare(compareValues.b);
      });
    const profilesWithDistrict = filteredProfiles
      .filter((item) =>
        item.areas.some((area) => area.area.type === "district")
      )
      .sort((a, b) => {
        let compareValues = getCompareValues(a, b);
        return compareValues.a.localeCompare(compareValues.b);
      });
    // 3.
    const stateId = areaToFilter.stateId; // TypeScript reasons...
    if (areaToFilter.type === "country") {
      sortedProfiles = [
        ...profilesWithCountry,
        ...profilesWithState,
        ...profilesWithDistrict,
      ];
    }
    // 3.1.
    if (areaToFilter.type === "state") {
      sortedProfiles = [
        ...profilesWithState.filter((item) =>
          item.areas.some((area) => area.area.stateId === stateId)
        ),
        ...profilesWithDistrict.filter((item) =>
          item.areas.some((area) => area.area.stateId === stateId)
        ),
        ...profilesWithCountry,
      ];
    }
    if (areaToFilter.type === "district") {
      sortedProfiles = [
        ...profilesWithDistrict.filter((item) =>
          item.areas.some((area) => area.area.stateId === stateId)
        ),
        ...profilesWithState.filter((item) =>
          item.areas.some((area) => area.area.stateId === stateId)
        ),
        ...profilesWithCountry,
      ];
    }
    // 4.
    const profilesSet = new Set(sortedProfiles);
    sortedProfiles = Array.from(profilesSet);
  } else {
    // Sorting firstName alphabetical when no area filter is applied
    sortedProfiles = filteredProfiles.sort((a, b) =>
      a.firstName.localeCompare(b.firstName)
    );
  }

  // Add avatars
  const profilesWithImages = sortedProfiles.map((item) => {
    let { avatar, ...rest } = item;

    if (avatar !== null) {
      const publicURL = getPublicURL(environment.authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
        });
      }
    }

    return { ...rest, avatar };
  });

  return {
    values,
    profiles: profilesWithImages,
  };
});

type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema> & {
    profiles: Profiles;
  }
>;

export const action: ActionFunction = async ({ request }) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);
  // TODO: Do we need an identity/authorization check for the filter action?
  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { authClient: authClient },
  });

  // TODO: fix type issue
  return json<ActionData>(result, { headers: response.headers });
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();
  const areaOptions = createAreaOptionFromData(loaderData.areas);

  let profiles = loaderData.profiles;

  if (actionData && actionData.success) {
    profiles = actionData.data.profiles;
  }

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    submit(event.currentTarget);
  };

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
          <RemixForm method="post" schema={schema} onChange={handleChange}>
            {({ Field, Button, Errors, register }) => (
              <>
                <div className="flex flex-wrap -mx-4">
                  <div className="form-control px-4 pb-4 flex-initial w-full md:w-1/3">
                    <Field
                      name="areaId"
                      label="Filtern nach Aktivitätsgebiet:"
                      className=""
                    >
                      {({ Errors }) => (
                        <>
                          <label className="block font-semibold mb-2">
                            Aktivitätsgebiet
                          </label>
                          <select
                            {...register("areaId")}
                            className="select w-full select-bordered"
                          >
                            <option></option>
                            {areaOptions.map((option, index) => (
                              <React.Fragment key={index}>
                                {"value" in option ? (
                                  <option
                                    key={`area-${index}`}
                                    value={option.value}
                                  >
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
                        </>
                      )}
                    </Field>
                  </div>
                  <div className="form-control px-4 pb-4 flex-initial w-full md:w-1/3">
                    <Field
                      name="offerId"
                      label="Filtern nach Angeboten:"
                      className=""
                    >
                      {({ Errors }) => (
                        <>
                          <label className="block font-semibold mb-2">
                            Ich suche
                          </label>
                          <select
                            {...register("offerId")}
                            className="select w-full select-bordered"
                          >
                            <option></option>
                            {loaderData.offers.map((offer) => (
                              <option
                                key={`offer-${offer.id}`}
                                value={offer.id}
                              >
                                {offer.title}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </Field>
                  </div>
                  <div className="form-control px-4 pb-4 flex-initial w-full md:w-1/3">
                    <Field
                      name="seekingId"
                      label="Filtern nach Gesuchen:"
                      className=""
                    >
                      {({ Errors }) => (
                        <>
                          <label className="block font-semibold mb-2">
                            Ich möchte unterstützen mit
                          </label>
                          <select
                            {...register("seekingId")}
                            className="select w-full select-bordered"
                          >
                            <option></option>
                            {loaderData.offers.map((offer) => (
                              <option
                                key={`seeking-${offer.id}`}
                                value={offer.id}
                              >
                                {offer.title}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </Field>
                  </div>
                  <Errors />
                </div>
                <div className="flex justify-end">
                  <noscript>
                    {/* TODO: selection not shown without javascript */}
                    <button type="submit" className="btn btn-primary mr-2">
                      Filter anwenden
                    </button>
                  </noscript>
                  <Link to={"./"} reloadDocument>
                    <div className="btn btn-primary">Filter zurücksetzen</div>
                  </Link>
                </div>
              </>
            )}
          </RemixForm>
        </section>
      ) : null}

      <section
        className="container my-8 md:my-10 lg:my-20"
        id="contact-details"
      >
        <div
          data-testid="grid"
          className="flex flex-wrap justify-center -mx-4 items-stretch"
        >
          {profiles.length > 0 ? (
            profiles.map((profile) => {
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

                    {profile.areas !== undefined && profile.areas.length > 0 ? (
                      <div className="flex font-semibold flex-col lg:flex-row w-full mt-3">
                        <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                          Aktivitätsgebiete
                        </div>
                        <div className="flex-auto line-clamp-3">
                          <span>
                            {profile.areas
                              .map((area) => area.area.name)
                              .join(" / ")}
                          </span>
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
