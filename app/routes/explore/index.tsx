import { Offer, Profile } from "@prisma/client";
import React from "react";
import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  useActionData,
  useLoaderData,
} from "remix";
import { getUserByRequest } from "~/auth.server";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { H1, H3 } from "~/components/Heading/Heading";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import {
  AreasWithState,
  getAllOffers,
  getAllProfiles,
  getFilteredProfiles,
  getAreas,
  getProfileByUserId,
} from "~/profile.server";
import { InputError, makeDomainFunction } from "remix-domains";
import {
  Form as RemixForm,
  formAction,
  PerformMutation,
  performMutation,
} from "remix-forms";
import { Schema, z } from "zod";
import { createAreaOptionFromData } from "~/lib/profile/createAreaOptionFromData";

// TODO: Change to enum of all possible area/seeking/offer ids
const schema = z.object({
  areaFilter: z.string().optional(),
  offerFilter: z.string().optional(),
  seekingFilter: z.string().optional(),
});

type CurrentUser = Pick<
  Profile,
  "username" | "firstName" | "lastName" | "academicTitle"
>;

type LoaderData = {
  currentUser?: CurrentUser;
  profiles?: Pick<
    Profile,
    | "username"
    | "firstName"
    | "lastName"
    | "academicTitle"
    | "position"
    | "bio"
    | "publicFields"
  > &
    { areas: { area: string }[] }[];

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
      "academicTitle",
      "position",
      "bio",
      "publicFields",
    ]);
    currentUser = profile || undefined; // TODO: fix type issue
  }

  let profiles;

  const allProfiles = await getAllProfiles();
  if (allProfiles !== null) {
    if (sessionUser !== null) {
      profiles = allProfiles;
    } else {
      profiles = allProfiles.map((profile) => {
        const { bio, position, publicFields, ...otherFields } = profile;

        let extensions: { bio?: string; position?: string } = {};
        if (publicFields !== undefined) {
          if (publicFields.includes("bio") && bio !== null) {
            extensions.bio = bio;
          }

          if (publicFields.includes("position") && position !== null) {
            extensions.position = position;
          }
        }

        return { ...otherFields, ...extensions };
      });
    }
  }

  const areas = await getAreas();
  const offers = await getAllOffers();

  return json({ currentUser, profiles, areas, offers });
};

const mutation = makeDomainFunction(schema)(async (values) => {
  if (!(values.areaFilter || values.offerFilter || values.seekingFilter)) {
    throw "Bitte ein Filterkriterium auswählen.";
  }
  const filteredProfiles = await getFilteredProfiles(
    values.areaFilter,
    values.offerFilter,
    values.seekingFilter
  );

  filteredProfiles?.map((profile) => {
    console.log("\n");
    console.log(profile.firstName, profile.lastName);
  });
  return { values, filteredProfiles };
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

      <section className="hidden md:block container mt-8 md:mt-10 lg:mt-20 text-center">
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
          <RemixForm method="post" schema={schema}>
            {({ Field, Button, Errors, register }) => (
              <>
                <Field
                  name="areaFilter"
                  label="Filtern nach Aktivitätsgebiet:"
                  className="mb-2"
                >
                  {({ Errors }) => (
                    <>
                      <label className="mr-2">Aktivitätsgebiet:</label>
                      <select {...register("areaFilter")}>
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
                <Field
                  name="offerFilter"
                  label="Filtern nach Angeboten:"
                  className="mb-2"
                >
                  {({ Errors }) => (
                    <>
                      <label className="mr-2">Angebot:</label>
                      <select {...register("offerFilter")}>
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
                <Field
                  name="seekingFilter"
                  label="Filtern nach Gesuchen:"
                  className="mb-2"
                >
                  {({ Errors }) => (
                    <>
                      <label className="mr-2">Gesuch:</label>
                      <select {...register("seekingFilter")}>
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
                <button type="submit" className="btn btn-primary">
                  Filter anwenden
                </button>
                <Errors />
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
          {loaderData.profiles !== undefined &&
            loaderData.profiles.length > 0 &&
            loaderData.profiles.map((profile, index) => (
              <div
                key={`profile-${index}`}
                data-testid="gridcell"
                className="flex-100 md:flex-1/2 lg:flex-1/3 px-4 lg:px-4 mb-8"
              >
                <Link
                  to={`/profile/${profile.username}`}
                  className="flex flex-wrap content-start items-start px-4 pt-4 lg:p-6 pb-8 rounded-3xl shadow h-full bg-neutral-200 hover:bg-neutral-400"
                >
                  <div className="w-full flex items-center flex-row mb-4">
                    <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-md">
                      {getInitials(profile)}
                    </div>
                    <div className="pl-4">
                      <H3 like="h4" className="text-xl mb-1">
                        {getFullName(profile)}
                      </H3>
                      {profile.position !== undefined && (
                        <p className="font-bold text-sm">{profile.position}</p>
                      )}
                    </div>
                  </div>

                  {profile.bio !== undefined && (
                    <p className="mb-3 line-clamp-2">{profile.bio}</p>
                  )}

                  {profile.areas !== undefined && profile.areas.length > 0 && (
                    <div className="flex font-semibold flex-col lg:flex-row w-full">
                      <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                        Aktivitätsgebiete
                      </div>
                      <div className="flex-auto">
                        <span>
                          {profile.areas
                            .map((area) => area.area.name)
                            .join(" / ")}
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
