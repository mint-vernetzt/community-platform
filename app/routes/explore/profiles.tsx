import { Area } from "@prisma/client";
import { GravityType } from "imgproxy/dist/types";
import React, { FormEvent } from "react";
import {
  ActionFunction,
  Link,
  LoaderFunction,
  useActionData,
  useLoaderData,
  useSubmit,
} from "remix";
import { makeDomainFunction } from "remix-domains";
import {
  Form as RemixForm,
  PerformMutation,
  performMutation,
} from "remix-forms";
import { Schema, z } from "zod";
import { getUserByRequest } from "~/auth.server";
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
import { getAllProfiles, getScoreOfEntity } from "./utils.server";

const schema = z.object({
  areaId: z.string().optional(),
  offerId: z.string().optional(),
  seekingId: z.string().optional(),
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

  const sessionUser = await getUserByRequest(request);

  const isLoggedIn = sessionUser !== null;

  let profiles;

  const allProfiles = await getAllProfiles();
  if (allProfiles !== null) {
    profiles = allProfiles
      .map((profile) => {
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
          const publicURL = getPublicURL(avatar);
          if (publicURL !== null) {
            avatarImage = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }

        return { ...otherFields, ...extensions, avatar: avatarImage };
      })
      .sort((a, b) => {
        const scoreA = getScoreOfEntity(a);
        const scoreB = getScoreOfEntity(b);

        if (scoreA === scoreB) {
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        }
        return scoreB - scoreA;
      });
  }

  const areas = await getAreas();
  const offers = await getAllOffers();

  return { isLoggedIn, profiles, areas, offers };
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

const mutation = makeDomainFunction(schema)(async (values) => {
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

  // TODO: Outsource profile sorting to database

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

  // Add avatars and logos
  const profilesWithImages = sortedProfiles.map((item) => {
    if ("username" in item) {
      let { avatar, ...rest } = item;

      if (avatar !== null) {
        const publicURL = getPublicURL(avatar);
        if (publicURL !== null) {
          avatar = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
          });
        }
      }

      return { ...rest, avatar };
    }
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
  const result = await performMutation({
    request,
    schema,
    mutation,
  });

  return result;
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
          Auf der Startseite findest Du eine Auswahl an persönlichen Profilen
          sowie Organisationen, Netzwerke und Projekte aus der MINT-Community.
          Über die Filterfunktion kannst Du herausfinden, welche weiteren
          Organisationen, Netzwerke und Projekte es gibt. Wer ist in Deinem
          Aktivitätsgebiet aktiv? Mit wem möchtest Du Dich vernetzen? Wo bieten
          sich Kooperationen an?
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
                                {"value" in option && (
                                  <option
                                    key={`area-${index}`}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                )}

                                {"options" in option && (
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
                                )}
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
                            {loaderData.offers.map((offer, index) => (
                              <option key={`offer-${index}`} value={offer.id}>
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
                            {loaderData.offers.map((offer, index) => (
                              <option key={`seeking-${index}`} value={offer.id}>
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
                  <Link to={"/explore"} reloadDocument>
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
            profiles.map((item, index) => {
              let slug, image, imageType, initials, name, subtitle;
              slug = `/profile/${item.username}`;
              image = item.avatar;
              imageType = "avatar";
              initials = getInitials(item);
              name = getFullName(item);
              subtitle = item.position;
              return (
                <div
                  key={`profile-${index}`}
                  data-testid="gridcell"
                  className="flex-100 md:flex-1/2 lg:flex-1/3 px-4 lg:px-4 mb-8"
                >
                  <Link
                    to={slug}
                    className="flex flex-wrap content-start items-start px-4 pt-4 lg:p-6 pb-8 rounded-3xl shadow h-full bg-neutral-200 hover:bg-neutral-400"
                  >
                    <div className="w-full flex flex-row">
                      {imageType === "avatar" && (
                        <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                          {image !== null ? (
                            <img src={image} alt="" />
                          ) : (
                            initials
                          )}
                        </div>
                      )}
                      {imageType === "logo" && (
                        <>
                          {image !== null ? (
                            <div className="w-16 h-16 rounded-full shrink-0 overflow-hidden flex items-center justify-center">
                              <img
                                className="max-w-full w-auto max-h-16 h-auto"
                                src={image}
                                alt={name}
                              />
                            </div>
                          ) : (
                            <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                              {initials}
                            </div>
                          )}
                        </>
                      )}
                      <div className="pl-4">
                        <H3 like="h4" className="text-xl mb-1">
                          {name}
                        </H3>
                        {subtitle !== null && (
                          <p className="font-bold text-sm">{subtitle}</p>
                        )}
                      </div>
                    </div>

                    {item.bio !== undefined && (
                      <p className="mt-3 line-clamp-2">{item.bio}</p>
                    )}

                    {item.areas !== undefined && item.areas.length > 0 && (
                      <div className="flex font-semibold flex-col lg:flex-row w-full mt-3">
                        <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                          Aktivitätsgebiete
                        </div>
                        <div className="flex-auto line-clamp-3">
                          <span>
                            {item.areas
                              .map((area) => area.area.name)
                              .join(" / ")}
                          </span>
                        </div>
                      </div>
                    )}
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
