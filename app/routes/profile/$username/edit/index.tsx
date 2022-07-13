import * as React from "react";

import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  useActionData,
  useLoaderData,
  useParams,
  useTransition,
} from "remix";
import { badRequest, forbidden } from "remix-utils";

import { getUserByRequest } from "~/auth.server";
import InputAdd from "~/components/FormElements/InputAdd/InputAdd";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectField from "~/components/FormElements/SelectField/SelectField";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import {
  AreasWithState,
  getAllOffers,
  getAreas,
  getProfileByUserId,
  updateProfileByUserId,
} from "~/profile.server";
import {
  ProfileError,
  ProfileFormFields,
  ProfileFormType,
  validateProfile,
} from "./yupSchema";

import { Offer } from "@prisma/client";
import { FormProvider, useForm } from "react-hook-form";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import useCSRF from "~/lib/hooks/useCSRF";
import { createAreaOptionFromData } from "~/lib/profile/createAreaOptionFromData";
import {
  createProfileFromFormData,
  profileListOperationResolver,
} from "~/lib/profile/form";
import { getInitials } from "~/lib/profile/getInitials";
import { socialMediaServices } from "~/lib/profile/socialMediaServices";
import { removeMoreThan2ConescutiveLinbreaks as removeMoreThan2ConescutiveLinebreaks } from "~/lib/string/removeMoreThan2ConescutiveLinbreaks";
import { validateCSRFToken } from "~/utils.server";
import Header from "../Header";
import ProfileMenu from "../ProfileMenu";

export async function handleAuthorization(request: Request, username: string) {
  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const currentUser = await getUserByRequest(request);

  if (currentUser?.user_metadata.username !== username) {
    throw forbidden({ message: "not allowed" });
  }

  return currentUser;
}

type LoaderData = {
  profile: ProfileFormType;
  areas: AreasWithState;
  offers: Offer[];
};

function makeFormProfileFromDbProfile(
  dbProfile: Awaited<ReturnType<typeof getProfileByUserId>>
) {
  return {
    ...dbProfile,
    areas: dbProfile?.areas.map((area) => area.areaId) ?? [],
    offers: dbProfile?.offers.map((offer) => offer.offerId) ?? [],
    seekings: dbProfile?.seekings.map((seeking) => seeking.offerId) ?? [],
  };
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const currentUser = await handleAuthorization(request, username);

  let dbProfile = await getProfileByUserId(currentUser.id, ProfileFormFields);
  let profile = makeFormProfileFromDbProfile(dbProfile);

  const areas = await getAreas();
  const offers = await getAllOffers();

  return json({ profile, areas, offers });
};

type ActionData = {
  profile: ProfileFormType;
  errors: ProfileError | boolean;
  lastSubmit: string;
  updated: boolean;
};

export const action: ActionFunction = async ({
  request,
  params,
}): Promise<ActionData> => {
  const username = params.username ?? "";
  const currentUser = await handleAuthorization(request, username);
  const formData = await request.clone().formData();
  let profile = createProfileFromFormData(formData);
  profile["bio"] = removeMoreThan2ConescutiveLinebreaks(profile["bio"] ?? "");

  await validateCSRFToken(request);

  const errors = await validateProfile(profile);
  let updated = false;

  const submit = formData.get("submit");
  if (submit === "submit") {
    if (errors === false) {
      delete profile.email;
      await updateProfileByUserId(currentUser.id, profile);

      updated = true;
    }
  } else {
    const listData: (keyof ProfileFormType)[] = [
      "skills",
      "interests",
      "offers",
      "seekings",
      "areas",
    ];

    listData.forEach((name) => {
      profile = profileListOperationResolver(profile, name, formData);
    });
  }

  return {
    profile,
    errors,
    lastSubmit: (formData.get("submit") as string) ?? "",
    updated,
  };
};

export default function Index() {
  const { username } = useParams();
  const transition = useTransition();
  const { profile: dbProfile, areas, offers } = useLoaderData<LoaderData>();

  const { hiddenCSRFInput } = useCSRF();

  const actionData = useActionData<ActionData>();
  const profile = actionData?.profile ?? dbProfile;

  const formRef = React.createRef<HTMLFormElement>();
  const isSubmitting = transition.state === "submitting";
  const errors = actionData?.errors as ProfileError;
  const methods = useForm<ProfileFormType>({
    defaultValues: profile,
  });
  const areaOptions = createAreaOptionFromData(areas);
  const offerOptions = offers.map((o) => ({
    label: o.title,
    value: o.id,
  }));

  const {
    register,
    reset,
    formState: { isDirty },
  } = methods;

  const selectedAreas =
    profile.areas && areas
      ? areas
          .filter((area) => profile.areas.includes(area.id))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

  const selectedOffers =
    profile.offers && offers
      ? offers
          .filter((offer) => profile.offers.includes(offer.id))
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  const selectedSeekings =
    profile.seekings && offers
      ? offers
          .filter((offer) => profile.seekings.includes(offer.id))
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  React.useEffect(() => {
    if (isSubmitting) {
      const $inputsToClear =
        formRef?.current?.getElementsByClassName("clear-after-submit");
      if ($inputsToClear) {
        Array.from($inputsToClear).forEach(
          (a) => ((a as HTMLInputElement).value = "")
        );
      }
    }

    if (actionData?.lastSubmit && formRef.current) {
      const lastInput = document.getElementsByName(actionData.lastSubmit);
      if (lastInput) {
        lastInput[0].focus();
      }
    }
  }, [isSubmitting, formRef, actionData]);

  const isFormChanged = isDirty || actionData?.updated === false;
  const initials = getInitials(profile);

  return (
    <>
      <Header username={username ?? ""} initials={initials} />
      <FormProvider {...methods}>
        <Form
          ref={formRef}
          name="profileForm"
          method="post"
          onSubmit={(e: React.SyntheticEvent) => {
            reset({}, { keepValues: true });
          }}
        >
          <button
            name="submit"
            type="submit"
            value="submit"
            className="hidden"
          />
          {hiddenCSRFInput}
          <fieldset disabled={transition.state === "submitting"}>
            <div className="container relative pb-44">
              <div className="flex flex-col lg:flex-row -mx-4 pt-10 lg:pt-0">
                <div className="basis-4/12 px-4">
                  <ProfileMenu username={username as string} />
                </div>
                <div className="basis-6/12 px-4">
                  <h1 className="mb-8">Persönliche Daten</h1>

                  <h4 className="mb-4 font-semibold">Allgemein</h4>

                  <p className="mb-8">
                    Welche Informationen möchtest Du über Dich mit der Community
                    teilen? Über das Augen-Symbol kannst Du auswählen, ob die
                    Informationen für alle öffentlich sichtbar sind oder ob Du
                    sie nur mit registrierten Nutzer:innen teilst.
                  </p>

                  <div className="flex flex-col md:flex-row -mx-4">
                    <div className="basis-full md:basis-6/12 px-4 mb-4">
                      <SelectField
                        {...register("academicTitle")}
                        label="Titel"
                        options={[
                          {
                            label: "Dr.",
                            value: "Dr.",
                          },
                          {
                            label: "Prof.",
                            value: "Prof.",
                          },
                          {
                            label: "Prof. Dr.",
                            value: "Prof. Dr.",
                          },
                        ]}
                        defaultValue={profile.academicTitle}
                      />
                    </div>
                    <div className="basis-full md:basis-6/12 px-4 mb-4">
                      <InputText
                        {...register("position")}
                        id="position"
                        label="Position"
                        defaultValue={profile.position}
                        isPublic={profile.publicFields?.includes("position")}
                        errorMessage={errors?.position?.message}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row -mx-4">
                    <div className="basis-full md:basis-6/12 px-4 mb-4">
                      <InputText
                        {...register("firstName")}
                        id="firstName"
                        label="Vorname"
                        defaultValue={profile.firstName}
                        required
                        errorMessage={errors?.firstName?.message}
                      />
                    </div>
                    <div className="basis-full md:basis-6/12 px-4 mb-4">
                      <InputText
                        {...register("lastName")}
                        id="lastName"
                        label="Nachname"
                        required
                        defaultValue={profile.lastName}
                        errorMessage={errors?.lastName?.message}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row -mx-4">
                    <div className="basis-full md:basis-6/12 px-4 mb-4">
                      <InputText
                        {...register("email")}
                        type="text"
                        id="email"
                        label="E-Mail"
                        readOnly
                        isPublic={profile.publicFields?.includes("email")}
                        defaultValue={profile.email}
                        errorMessage={errors?.email?.message}
                      />
                    </div>
                    <div className="basis-full md:basis-6/12 px-4 mb-4">
                      <InputText
                        {...register("phone")}
                        id="phone"
                        label="Telefon"
                        isPublic={profile.publicFields?.includes("phone")}
                        defaultValue={profile.phone}
                        errorMessage={errors?.phone?.message}
                      />
                    </div>
                  </div>

                  <hr className="border-neutral-400 my-10 lg:my-16" />

                  <div className="flex flex-row items-center mb-4">
                    <h4 className="font-semibold">Über mich</h4>
                  </div>

                  <p className="mb-8">
                    Erzähl der Community etwas über Dich: Wer bist Du und was
                    machst du konkret im MINT-Bereich? In welchen Regionen
                    Deutschlands bist Du vorrangig aktiv? Welche Kompetenzen
                    bringst Du mit und welche Themen interessieren Dich im
                    MINT-Kontext besonders?
                  </p>

                  <div className="mb-4">
                    <TextAreaWithCounter
                      {...register("bio")}
                      id="bio"
                      label="Kurzbeschreibung"
                      isPublic={profile.publicFields?.includes("bio")}
                      defaultValue={profile.bio}
                      errorMessage={errors?.bio?.message}
                      maxCharacters={500}
                    />
                  </div>

                  <div className="mb-4">
                    <SelectAdd
                      name="areas"
                      label={"Aktivitätsgebiete"}
                      placeholder="Aktivitätsgebiete hinzufügen"
                      entries={selectedAreas.map((area) => ({
                        label: area.name,
                        value: area.id,
                      }))}
                      options={areaOptions}
                    />
                  </div>

                  <div className="mb-4">
                    <InputAdd
                      name="skills"
                      label="Kompetenzen"
                      placeholder="Kompetenz hinzufügen"
                      entries={profile.skills ?? []}
                      isPublic={profile.publicFields?.includes("skills")}
                    />
                  </div>

                  <div className="mb-4">
                    <InputAdd
                      name="interests"
                      label="Interessen"
                      placeholder="Interesse hinzufügen"
                      entries={profile.interests ?? []}
                      isPublic={profile.publicFields?.includes("interests")}
                    />
                  </div>

                  <hr className="border-neutral-400 my-10 lg:my-16" />
                  <h4 className="mb-4 font-semibold">Ich biete</h4>

                  <p className="mb-8">
                    Was bringst Du mit, wovon die Community profitieren kann?
                    Wie kannst Du andere Mitglieder unterstützen?
                  </p>

                  <div className="mb-4">
                    <SelectAdd
                      name="offers"
                      label="Angebot"
                      entries={selectedOffers.map((area) => ({
                        label: area.title,
                        value: area.id,
                      }))}
                      options={offerOptions.filter(
                        (o) => !profile.offers.includes(o.value)
                      )}
                      placeholder=""
                      isPublic={profile.publicFields?.includes("offers")}
                    />
                  </div>

                  <hr className="border-neutral-400 my-10 lg:my-16" />

                  <h4 className="mb-4 font-semibold">Ich suche</h4>

                  <p className="mb-8">
                    Wonach suchst Du? Wie können Dich andere Mitglieder
                    unterstützen?
                  </p>

                  <div className="mb-4">
                    <SelectAdd
                      name="seekings"
                      label="Suche"
                      entries={selectedSeekings.map((area) => ({
                        label: area.title,
                        value: area.id,
                      }))}
                      options={offerOptions.filter(
                        (o) => !profile.seekings.includes(o.value)
                      )}
                      placeholder=""
                      isPublic={profile.publicFields?.includes("seekings")}
                    />
                  </div>

                  <hr className="border-neutral-400 my-10 lg:my-16" />

                  <h2 className="mb-8">Website und Soziale Netzwerke</h2>

                  <h4 className="mb-4 font-semibold">Website</h4>

                  <p className="mb-8">
                    Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                    diam nonumy eirmod tempor invidunt ut labore et dolore magna
                    aliquyam erat, sed diam voluptua.
                  </p>

                  <div className="basis-full mb-4">
                    <InputText
                      {...register("website")}
                      id="website"
                      label="Website URL"
                      defaultValue={profile.website}
                      placeholder="domainname.tld"
                      isPublic={profile.publicFields?.includes("website")}
                      errorMessage={errors?.website?.message}
                      withClearButton
                    />
                  </div>

                  <hr className="border-neutral-400 my-10 lg:my-16" />

                  <h4 className="mb-4 font-semibold">Soziale Netzwerke</h4>

                  <p className="mb-8">
                    Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                    diam nonumy eirmod tempor invidunt ut labore et dolore magna
                    aliquyam erat, sed diam voluptua.
                  </p>

                  <div className="basis-full mb-4">
                    {socialMediaServices.map((service) => (
                      <InputText
                        key={service.id}
                        {...register(service.id)}
                        id={service.id}
                        label={service.label}
                        placeholder={service.placeholder}
                        defaultValue={profile[service.id] as string}
                        isPublic={profile.publicFields?.includes(service.id)}
                        errorMessage={errors?.[service.id]?.message}
                        withClearButton
                      />
                    ))}
                  </div>

                  <hr className="border-neutral-400 my-10 lg:my-16" />

                  <div className="flex flex-row items-center mb-4">
                    <h4 className="font-semibold">
                      Organisation, Netzwerk, Projekt hinzufügen
                    </h4>
                    <Link
                      to="/organization/create"
                      className="btn btn-outline-primary ml-auto btn-small"
                    >
                      Organisation anlegen
                    </Link>
                  </div>
                  <p className="mb-8">
                    Die Organisation, das Netzwerk oder das Projekt, in dem Du
                    tätig bist, hat noch kein Profil? Füge es direkt hinzu,
                    damit auch andere Mitglieder über darüber erfahren können.
                  </p>

                  <div className="mb-4">
                    <InputAdd
                      name="organizations"
                      label="Organisation, Netzwerk, Projekt hinzufügen"
                      readOnly
                      placeholder="Noch nicht implementiert"
                      entries={[]}
                    />
                  </div>
                </div>
              </div>

              <footer className="fixed z-10 bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
                <div className="container">
                  <div className="py-4 md:py-8 flex flex-row flex-nowrap items-center justify-between md:justify-end">
                    <div
                      className={`text-green-500 text-bold ${
                        actionData?.updated && !isSubmitting
                          ? "block animate-fade-out"
                          : "hidden"
                      }`}
                    >
                      Profil wurde aktualisiert.
                    </div>

                    {isFormChanged && (
                      <Link
                        to={`/profile/${username}/edit`}
                        reloadDocument
                        className={`btn btn-link`}
                      >
                        Änderungen verwerfen
                      </Link>
                    )}
                    <div></div>
                    <button
                      type="submit"
                      name="submit"
                      value="submit"
                      className="btn btn-primary ml-4"
                      disabled={isSubmitting || !isFormChanged}
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              </footer>
            </div>
          </fieldset>
        </Form>
      </FormProvider>
    </>
  );
}
