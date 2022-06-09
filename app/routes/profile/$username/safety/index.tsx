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

import {
  getProfileByUserId,
  getAreas,
  updateProfileByUserId,
  AreasWithState,
  getAllOffers,
} from "~/profile.server";
import { getUser } from "~/auth.server";
import InputAdd from "~/components/FormElements/InputAdd/InputAdd";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectField from "~/components/FormElements/SelectField/SelectField";
import TextArea from "~/components/FormElements/TextArea/TextArea";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import {
  ProfileError,
  ProfileFormFields,
  ProfileFormType,
  validateProfile,
} from "../edit/yupSchema";

import {
  createProfileFromFormData,
  profileListOperationResolver,
} from "~/lib/profile/form";
import { FormProvider, useForm } from "react-hook-form";
import { createAreaOptionFromData } from "~/lib/profile/createAreaOptionFromData";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import { getInitials } from "~/lib/profile/getInitials";
import { Offer } from "@prisma/client";
import { removeMoreThan2ConescutiveLinbreaks as removeMoreThan2ConescutiveLinebreaks } from "~/lib/string/removeMoreThan2ConescutiveLinbreaks";
import { socialMediaServices } from "~/lib/profile/socialMediaServices";

export async function handleAuthorization(request: Request, username: string) {
  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const currentUser = await getUser(request);

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
  const formData = await request.formData();
  let profile = createProfileFromFormData(formData);
  profile["bio"] = removeMoreThan2ConescutiveLinebreaks(profile["bio"] ?? "");

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
      <header className="shadow-md mb-8">
        <div className="container mx-auto px-4 relative z-11">
          <div className="basis-full md:basis-6/12 px-4 pt-3 pb-3 flex flex-row items-center">
            <div>
              <Link to="/explore">
                <HeaderLogo />
              </Link>
            </div>

            <div className="ml-auto">
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-primary w-10 h-10">
                  {initials}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li>
                    <Link to={`/profile/${username}`}>Profil anzeigen</Link>
                  </li>
                  <li>
                    <Link to={`/profile/${username}/edit`}>
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
          </div>
        </div>
      </header>
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
          <fieldset disabled={transition.state === "submitting"}>
            <div className="container mx-auto px-4 relative z-10 pb-44">
              <div className="flex flex-col lg:flex-row -mx-4">
                {/* refactor menu */}
                <div className="md:flex md:flex-row px-4 pt-10 lg:pt-0">
                  <div className="basis-4/12 px-4">
                    <div className="px-4 py-8 lg:p-8 pb-15 rounded-lg bg-neutral-200 shadow-lg relative mb-8">
                      <h3 className="font-bold mb-7">Profil bearbeiten</h3>
                      {/*TODO: add missing pages*/}
                      <ul>
                        <li>
                          <a
                            href={`/profile/${username}/edit`}
                            className="block text-3xl  text-neutral-500 hover:text-primary py-3"
                          >
                            Persönliche Daten
                          </a>
                        </li>
                        <li>
                          <a
                            href={`/profile/${username}/safety`}
                            className="block text-3xl text-primary py-3"
                          >
                            Login und Sicherheit
                          </a>
                        </li>
                      </ul>

                      <hr className="border-neutral-400 my-4 lg:my-8" />

                      <div className="">
                        {/* <a
                          href="/#"
                          className="block text-3xl text-neutral-500 hover:text-primary py-3"
                        > */}
                        <span className="block text-3xl text-neutral-500  py-3">
                          Profil löschen
                        </span>
                        {/* </a> */}
                      </div>
                    </div>
                    <div className="px-8 relative mb-16">
                      <p className="text-xs flex items-center mb-4">
                        <span className="icon w-4 h-4 mr-3">
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M20 10C20 10 16.25 3.125 10 3.125C3.75 3.125 0 10 0 10C0 10 3.75 16.875 10 16.875C16.25 16.875 20 10 20 10ZM1.46625 10C2.07064 9.0814 2.7658 8.22586 3.54125 7.44625C5.15 5.835 7.35 4.375 10 4.375C12.65 4.375 14.8488 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.0814 18.535 10C18.4625 10.1087 18.3825 10.2287 18.2913 10.36C17.8725 10.96 17.2538 11.76 16.46 12.5538C14.8488 14.165 12.6488 15.625 10 15.625C7.35 15.625 5.15125 14.165 3.54 12.5538C2.76456 11.7741 2.0694 10.9186 1.465 10H1.46625Z"
                              fill="currentColor"
                            />
                            <path
                              d="M10 6.875C9.1712 6.875 8.37634 7.20424 7.79029 7.79029C7.20424 8.37634 6.875 9.1712 6.875 10C6.875 10.8288 7.20424 11.6237 7.79029 12.2097C8.37634 12.7958 9.1712 13.125 10 13.125C10.8288 13.125 11.6237 12.7958 12.2097 12.2097C12.7958 11.6237 13.125 10.8288 13.125 10C13.125 9.1712 12.7958 8.37634 12.2097 7.79029C11.6237 7.20424 10.8288 6.875 10 6.875ZM5.625 10C5.625 8.83968 6.08594 7.72688 6.90641 6.90641C7.72688 6.08594 8.83968 5.625 10 5.625C11.1603 5.625 12.2731 6.08594 13.0936 6.90641C13.9141 7.72688 14.375 8.83968 14.375 10C14.375 11.1603 13.9141 12.2731 13.0936 13.0936C12.2731 13.9141 11.1603 14.375 10 14.375C8.83968 14.375 7.72688 13.9141 6.90641 13.0936C6.08594 12.2731 5.625 11.1603 5.625 10Z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                        <span>Für alle sichtbar</span>
                      </p>

                      <p className="text-xs flex items-center mb-4">
                        <span className="icon w-5 h-5 mr-2">
                          <svg
                            className="block w-4 h-5 "
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.6987 14.0475C18.825 12.15 20 10 20 10C20 10 16.25 3.125 10 3.125C8.79949 3.12913 7.61256 3.37928 6.5125 3.86L7.475 4.82375C8.28429 4.52894 9.13868 4.3771 10 4.375C12.65 4.375 14.8487 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.08141 18.535 10C18.4625 10.1088 18.3825 10.2288 18.2912 10.36C17.8725 10.96 17.2537 11.76 16.46 12.5538C16.2537 12.76 16.0387 12.9638 15.8137 13.1613L16.6987 14.0475Z"
                              fill="#454C5C"
                            />
                            <path
                              d="M14.1212 11.47C14.4002 10.6898 14.4518 9.84643 14.2702 9.03803C14.0886 8.22962 13.6811 7.48941 13.0952 6.90352C12.5093 6.31764 11.7691 5.91018 10.9607 5.72854C10.1523 5.5469 9.30895 5.59856 8.52875 5.8775L9.5575 6.90625C10.0379 6.83749 10.5277 6.88156 10.9881 7.03495C11.4485 7.18835 11.8668 7.44687 12.21 7.79001C12.5531 8.13316 12.8116 8.55151 12.965 9.01191C13.1184 9.47231 13.1625 9.96211 13.0937 10.4425L14.1212 11.47ZM10.4425 13.0937L11.47 14.1212C10.6898 14.4002 9.84643 14.4518 9.03803 14.2702C8.22962 14.0886 7.48941 13.6811 6.90352 13.0952C6.31764 12.5093 5.91018 11.7691 5.72854 10.9607C5.5469 10.1523 5.59856 9.30895 5.8775 8.52875L6.90625 9.5575C6.83749 10.0379 6.88156 10.5277 7.03495 10.9881C7.18835 11.4485 7.44687 11.8668 7.79001 12.21C8.13316 12.5531 8.55151 12.8116 9.01191 12.965C9.47231 13.1184 9.96211 13.1625 10.4425 13.0937Z"
                              fill="#454C5C"
                            />
                            <path
                              d="M4.1875 6.8375C3.9625 7.0375 3.74625 7.24 3.54 7.44625C2.76456 8.22586 2.0694 9.08141 1.465 10L1.70875 10.36C2.1275 10.96 2.74625 11.76 3.54 12.5538C5.15125 14.165 7.35125 15.625 10 15.625C10.895 15.625 11.7375 15.4588 12.525 15.175L13.4875 16.14C12.3874 16.6207 11.2005 16.8708 10 16.875C3.75 16.875 0 10 0 10C0 10 1.17375 7.84875 3.30125 5.9525L4.18625 6.83875L4.1875 6.8375ZM17.0575 17.9425L2.0575 2.9425L2.9425 2.0575L17.9425 17.0575L17.0575 17.9425Z"
                              fill="#454C5C"
                            />
                          </svg>
                        </span>
                        <span>Für unregistrierte Nutzer nicht sichtbar</span>
                      </p>
                    </div>
                  </div>
                  <div className="basis-6/12 px-4">
                    <h1 className="mb-8">Persönliche Daten</h1>

                    <h4 className="mb-4 font-semibold">Allgemein</h4>

                    <p className="mb-8">
                      Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                      sed diam nonumy eirmod tempor invidunt ut labore et dolore
                      magna aliquyam erat, sed diam voluptua.
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
                      Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                      sed diam nonumy eirmod tempor invidunt ut labore et dolore
                      magna aliquyam erat, sed diam voluptua.
                    </p>

                    <div className="mb-4">
                      <TextArea
                        {...register("bio")}
                        id="bio"
                        label="Kurzbeschreibung"
                        isPublic={profile.publicFields?.includes("bio")}
                        defaultValue={profile.bio}
                        errorMessage={errors?.bio?.message}
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
                      Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                      sed diam nonumy eirmod tempor invidunt ut labore et dolore
                      magna aliquyam erat, sed diam voluptua.
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
                      Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                      sed diam nonumy eirmod tempor invidunt ut labore et dolore
                      magna aliquyam erat, sed diam voluptua.
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
                      Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                      sed diam nonumy eirmod tempor invidunt ut labore et dolore
                      magna aliquyam erat, sed diam voluptua.
                    </p>

                    <div className="basis-full mb-4">
                      <InputText
                        {...register("website")}
                        id="website"
                        label="Website URL"
                        defaultValue={profile.website}
                        placeholder="https://www.domainname.tld/"
                        isPublic={profile.publicFields?.includes("website")}
                        errorMessage={errors?.website?.message}
                        withClearButton
                      />
                    </div>

                    <hr className="border-neutral-400 my-10 lg:my-16" />

                    <h4 className="mb-4 font-semibold">Soziale Netzwerke</h4>

                    <p className="mb-8">
                      Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                      sed diam nonumy eirmod tempor invidunt ut labore et dolore
                      magna aliquyam erat, sed diam voluptua.
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
                      <h4 className="font-semibold">Organisation hinzufügen</h4>
                      <button
                        type="submit"
                        className="btn btn-outline-primary ml-auto btn-small"
                        disabled
                      >
                        Organisation anlegen
                      </button>
                    </div>
                    <p className="mb-8">
                      Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                      sed diam nonumy eirmod tempor invidunt ut labore et dolore
                      magna aliquyam erat, sed diam voluptua.
                    </p>

                    <div className="mb-4">
                      <InputAdd
                        name="organizations"
                        label="Organisation hinzufügen"
                        readOnly
                        placeholder="Noch nicht implementiert"
                        entries={[]}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <footer className="fixed z-10 bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
                <div className="md:container md:mx-auto ">
                  <div className="px-4 py-8 flex flex-row items-center justify-end">
                    <div className="">
                      <div className=""></div>

                      <div
                        className={`float-left mt-2 text-green-500 text-bold ${
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
                </div>
              </footer>
            </div>
          </fieldset>
        </Form>
      </FormProvider>
    </>
  );
}
