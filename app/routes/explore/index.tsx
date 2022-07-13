import { Area, Offer, Profile } from "@prisma/client";
import React, { RefObject, useRef } from "react";
import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  useActionData,
  useFetcher,
  useLoaderData,
} from "remix";
import { GravityType } from "imgproxy/dist/types";
import { getUserByRequest } from "~/auth.server";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { H1, H3 } from "~/components/Heading/Heading";
import { builder } from "~/imgproxy";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import {
  AreasWithState,
  getAllOffers,
  getAllProfiles,
  getFilteredProfiles,
  getAreas,
  getProfileByUserId,
  getAreaById,
  ProfileWithRelations,
} from "~/profile.server";
import { makeDomainFunction } from "remix-domains";
import {
  Form as RemixForm,
  PerformMutation,
  performMutation,
} from "remix-forms";
import { Schema, z } from "zod";
import { createAreaOptionFromData } from "~/lib/profile/createAreaOptionFromData";
import { supabaseAdmin } from "~/supabase";
import {
  getAllOrganizations,
  OrganizationWithRelations,
} from "~/organization.server";
import { getOrganizationInitials } from "~/lib/organization/getOrganizationInitials";

const schema = z.object({
  areaId: z.string().optional(),
  offerId: z.string().optional(),
  seekingId: z.string().optional(),
});

type CurrentUser = Pick<
  Profile,
  "username" | "firstName" | "lastName" | "academicTitle"
>;

type LoaderData = {
  currentUser?: CurrentUser;
  profilesAndOrganizations:
    | ProfileWithRelations[]
    | OrganizationWithRelations[]
    | undefined;
  areas: AreasWithState;
  offers: Offer[];
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  const sessionUser = await getUserByRequest(request);

  let currentUser: CurrentUser | undefined;

  if (sessionUser !== null) {
    const profile = await getProfileByUserId(sessionUser.id, [
      "username",
      "firstName",
      "lastName",
      "avatar",
    ]);

    currentUser = profile || undefined; // TODO: fix type issue
  }

  let profiles;

  const allProfiles = await getAllProfiles();
  if (allProfiles !== null) {
    profiles = allProfiles.map((profile) => {
      const { bio, position, avatar, publicFields, ...otherFields } = profile;
      let extensions: { bio?: string; position?: string } = {};

      if (sessionUser !== null && publicFields !== undefined) {
        if (publicFields.includes("bio") && bio !== null) {
          extensions.bio = bio;
        }

        if (publicFields.includes("position") && position !== null) {
          extensions.position = position;
        }
      }

      let avatarImage: string | null = null;

      if (avatar !== null) {
        const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
          .from("images")
          .getPublicUrl(avatar);
        if (publicURL !== null) {
          avatarImage = builder
            .resize("fill", 64, 64)
            .gravity(GravityType.center)
            .dpr(2)
            .generateUrl(publicURL);
        }
      }

      return { ...otherFields, ...extensions, avatar: avatarImage };
    });
  }

  const areas = await getAreas();
  const offers = await getAllOffers();

  let organizations;

  const allOrganizations = await getAllOrganizations();
  if (allOrganizations !== null) {
    organizations = allOrganizations.map((organization) => {
      const { bio, publicFields, logo, ...otherFields } = organization;
      let extensions: { bio?: string } = {};

      if (sessionUser !== null && publicFields !== undefined) {
        if (publicFields.includes("bio") && bio !== null) {
          extensions.bio = bio;
        }
      }

      let logoImage: string | null = null;

      if (logo !== null) {
        const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
          .from("images")
          .getPublicUrl(logo);
        if (publicURL !== null) {
          logoImage = builder
            .resize("fill", 64, 64)
            .gravity(GravityType.center)
            .dpr(2)
            .generateUrl(publicURL);
        }
      }

      return { ...otherFields, ...extensions, logo: logoImage };
    });
  }

  let profilesAndOrganizations;
  if (profiles !== undefined && organizations !== undefined) {
    profilesAndOrganizations = [...profiles, ...organizations];
  } else if (profiles !== undefined) {
    profilesAndOrganizations = [...profiles];
  } else if (organizations !== undefined) {
    profilesAndOrganizations = [...organizations];
  }
  profilesAndOrganizations = profilesAndOrganizations?.sort(
    () => Math.random() - 0.5
  );

  return json({ currentUser, profilesAndOrganizations, areas, offers });
};

const mutation = makeDomainFunction(schema)(async (values) => {
  let areaToFilter: Pick<Area, "id" | "type" | "stateId"> | null | undefined;

  if (!(values.areaId || values.offerId || values.seekingId)) {
    throw "";
  }

  if (values.areaId) {
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
      .filter((profile) =>
        profile.areas.some((area) => area.area.type === "country")
      )
      // 2.
      .sort((a, b) => a.username.localeCompare(b.username));
    const profilesWithState = filteredProfiles
      .filter((profile) =>
        profile.areas.some((area) => area.area.type === "state")
      )
      .sort((a, b) => a.username.localeCompare(b.username));
    const profilesWithDistrict = filteredProfiles
      .filter((profile) =>
        profile.areas.some((area) => area.area.type === "district")
      )
      .sort((a, b) => a.username.localeCompare(b.username));
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
        ...profilesWithState.filter((profile) =>
          profile.areas.some((area) => area.area.stateId === stateId)
        ),
        ...profilesWithDistrict.filter((profile) =>
          profile.areas.some((area) => area.area.stateId === stateId)
        ),
        ...profilesWithCountry,
      ];
    }
    if (areaToFilter.type === "district") {
      sortedProfiles = [
        ...profilesWithDistrict.filter((profile) =>
          profile.areas.some((area) => area.area.stateId === stateId)
        ),
        ...profilesWithState.filter((profile) =>
          profile.areas.some((area) => area.area.stateId === stateId)
        ),
        ...profilesWithCountry,
      ];
    }
    // 4.
    const profilesSet = new Set(sortedProfiles);
    sortedProfiles = Array.from(profilesSet);
  } else {
    // Sorting username alphabetical when no area filter is applied
    sortedProfiles = filteredProfiles.sort((a, b) =>
      a.username.localeCompare(b.username)
    );
  }

  return { values, sortedProfiles };
});

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

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

  let initialsOfCurrentUser = "";
  if (loaderData.currentUser !== undefined) {
    initialsOfCurrentUser = getInitials(loaderData.currentUser);
  }
  const areaOptions = createAreaOptionFromData(loaderData.areas);

  let profilesAndOrganizations = loaderData.profilesAndOrganizations;

  if (actionData && actionData.success) {
    profilesAndOrganizations = actionData.data.sortedProfiles; // TODO: Fix type issue
  }

  const formRef = useRef<HTMLFormElement>();
  const handleSubmit = () => {
    console.log("HANDLE SUBMIT", formRef.current);
    formRef.current?.submit();
  };

  return (
    <>
      <header className="shadow-md mb-8">
        <div className="container relative z-10">
          <div className="py-3 flex flex-row items-center">
            <div>
              <Link to="/explore">
                <HeaderLogo />
              </Link>
            </div>
            {/* TODO: link to login on anon*/}
            {loaderData.currentUser !== undefined ? (
              <div className="ml-auto">
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-primary w-10 h-10">
                    {initialsOfCurrentUser}
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                  >
                    <li>
                      <Link to={`/profile/${loaderData.currentUser.username}`}>
                        Profil anzeigen
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/profile/${loaderData.currentUser.username}/edit`}
                      >
                        Profil bearbeiten
                      </Link>
                    </li>
                    <li>
                      <Form action="/logout?index" method="post">
                        <button type="submit" className="w-full text-left">
                          Logout
                        </button>
                      </Form>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="ml-auto">
                <Link
                  to="/login"
                  className="text-primary font-bold hover:underline"
                >
                  Anmelden
                </Link>{" "}
                /{" "}
                <Link
                  to="/register"
                  className="text-primary font-bold hover:underline"
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Entdecke die Community</H1>
        <p className="">
          Hier siehst Du persönliche Profile sowie Organisationen, Netzwerke und
          Projekte aus der MINT-Community. Über die Filterfunktion kannst Du
          herausfinden, welche Organisationen, Netzwerke und Projekte es gibt.
          Wer ist in Deiner Region aktiv? Mit wem möchtest Du Dich vernetzen? Wo
          bieten sich Kooperationen an?
        </p>
      </section>

      {loaderData.currentUser !== undefined ? (
        <section className="container my-8">
          <RemixForm
            ref={formRef as RefObject<HTMLFormElement>}
            method="post"
            schema={schema}
            onChange={handleSubmit}
          >
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
                            Aktivitätsgebiet:
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
                            Angebot:
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
                            Gesuch:
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
                <button type="submit" className="hidden" />
                <Link
                  to={"/explore"}
                  reloadDocument
                  className="flex justify-end"
                >
                  <div className="btn btn-primary">Filter zurücksetzen</div>
                </Link>
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
          {profilesAndOrganizations !== undefined &&
            profilesAndOrganizations.length > 0 &&
            profilesAndOrganizations.map((profileOrOrganization, index) => {
              let slug, image, initials, name, subtitle;
              if ("username" in profileOrOrganization) {
                slug = `/profile/${profileOrOrganization.username}`;
                image = profileOrOrganization.avatar;
                initials = getInitials(profileOrOrganization);
                name = getFullName(profileOrOrganization);
                subtitle = profileOrOrganization.position;
              } else {
                slug = `/organization/${profileOrOrganization.slug}`;
                image = profileOrOrganization.logo;
                initials = getOrganizationInitials(profileOrOrganization.name);
                name = profileOrOrganization.name;
                subtitle = profileOrOrganization.types
                  .map(({ organizationType }) => organizationType.title)
                  .join(" / ");
              }
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
                    <div className="w-full flex items-center flex-row mb-4">
                      <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-md overflow-hidden">
                        {image !== null ? <img src={image} alt="" /> : initials}
                      </div>
                      <div className="pl-4">
                        <H3 like="h4" className="text-xl mb-1">
                          {name}
                        </H3>
                        {subtitle !== null && (
                          <p className="font-bold text-sm">{subtitle}</p>
                        )}
                      </div>
                    </div>

                    {profileOrOrganization.bio !== undefined && (
                      <p className="mb-3 line-clamp-2">
                        {profileOrOrganization.bio}
                      </p>
                    )}

                    {profileOrOrganization.areas !== undefined &&
                      profileOrOrganization.areas.length > 0 && (
                        <div className="flex font-semibold flex-col lg:flex-row w-full">
                          <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                            Aktivitätsgebiete
                          </div>
                          <div className="flex-auto">
                            <span>
                              {profileOrOrganization.areas
                                .map((area) => area.area.name)
                                .join(" / ")}
                            </span>
                          </div>
                        </div>
                      )}
                  </Link>
                </div>
              );
            })}
        </div>
      </section>
    </>
  );
}
