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
} from "~/profile.server";
import { getUser } from "~/auth.server";
import InputAdd from "~/components/FormElements/InputAdd/InputAdd";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectField, {
  OptionOrGroup,
} from "~/components/FormElements/SelectField/SelectField";
import TextArea from "~/components/FormElements/TextArea/TextArea";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import {
  ProfileError,
  ProfileFormFields,
  ProfileFormType,
  validateProfile,
} from "./yupSchema";

import {
  createProfileFromFormData,
  profileListOperationResolver,
} from "~/lib/profile/form";
import { FormProvider, useForm } from "react-hook-form";
import { createAreaOptionFromData } from "~/lib/profile/createAreaOptionFromData";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import { getInitials } from "~/lib/profile/getInitials";

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
  areaOptions: OptionOrGroup[];
  areas: AreasWithState;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const currentUser = await handleAuthorization(request, username);

  let dbProfile = await getProfileByUserId(currentUser.id, ProfileFormFields);
  let profile = {
    ...dbProfile,
    areas: dbProfile?.areas.map((area) => area.areaId) ?? [],
  };
  const areas = await getAreas();
  const areaOptions = createAreaOptionFromData(areas);

  return json({ profile, areaOptions, areas });
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
      "seekings",
      "skills",
      "interests",
      "offerings",
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
  const {
    profile: dbProfile,
    areaOptions,
    areas,
  } = useLoaderData<LoaderData>();

  const actionData = useActionData<ActionData>();
  const profile = actionData?.profile ?? dbProfile;

  const formRef = React.createRef<HTMLFormElement>();
  const isSubmitting = transition.state === "submitting";
  const errors = actionData?.errors as ProfileError;
  const methods = useForm<ProfileFormType>({
    defaultValues: profile,
  });

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
        <div className="md:container md:mx-auto relative z-11">
          <div className="px-4 pt-3 pb-3 flex flex-row items-center">
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
          method="post"
          onSubmit={() => {
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
            <div>
              <div className="md:container md:mx-auto relative z-10 pb-44">
                <div className="flex flex-row -mx-4">
                  <div className="basis-4/12 px-4">
                    <div className="p-4 lg:p-8 pb-15 md:pb-5 rounded-lg bg-neutral-200 shadow-lg relative">
                      <h3 className="font-bold mb-7">Profil bearbeiten</h3>
                      <ul>
                        <li>
                          <a
                            href="/#"
                            className="block text-3xl text-primary py-3"
                          >
                            Persönliche Daten
                          </a>
                        </li>
                        <li>
                          <a
                            href="/#"
                            className="block text-3xl text-neutral-500 hover:text-primary py-3"
                          >
                            Login und Sicherheit
                          </a>
                        </li>
                        <li>
                          <a
                            href="/#"
                            className="block text-3xl text-neutral-500 hover:text-primary py-3"
                          >
                            Website und Soziale Netzwerke
                          </a>
                        </li>
                      </ul>

                      <hr className="border-neutral-400 my-8" />

                      <div className="">
                        <a
                          href="/#"
                          className="block text-3xl text-neutral-500 hover:text-primary py-3"
                        >
                          Profil löschen
                        </a>
                      </div>
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

                    <div className="flex flex-row -mx-4 mb-4">
                      <div className="basis-6/12 px-4">
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
                      <div className="basis-6/12 px-4">
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

                    <div className="flex flex-row -mx-4 mb-4">
                      <div className="basis-6/12 px-4">
                        <InputText
                          {...register("firstName")}
                          id="firstName"
                          label="Vorname"
                          defaultValue={profile.firstName}
                          required
                          errorMessage={errors?.firstName?.message}
                        />
                      </div>
                      <div className="basis-6/12 px-4">
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

                    <div className="flex flex-row -mx-4 mb-4">
                      <div className="basis-6/12 px-4">
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
                      <div className="basis-6/12 px-4">
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

                    <hr className="border-neutral-400 my-16" />

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
                        isPublic={profile.publicFields?.includes(
                          "activityAreas"
                        )}
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

                    <hr className="border-neutral-400 mb-16" />

                    <h4 className="mb-4 font-semibold">Ich biete</h4>

                    <p className="mb-8">
                      Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                      sed diam nonumy eirmod tempor invidunt ut labore et dolore
                      magna aliquyam erat, sed diam voluptua.
                    </p>

                    <div className="mb-4">
                      <InputAdd
                        name="offerings"
                        label="Angebot"
                        readOnly
                        placeholder="Noch nicht implementiert"
                        entries={profile.offerings ?? []}
                        isPublic={profile.publicFields?.includes("offerings")}
                      />
                    </div>

                    <hr className="border-neutral-400 my-16" />

                    <h4 className="mb-4 font-semibold">Ich suche</h4>

                    <p className="mb-8">
                      Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                      sed diam nonumy eirmod tempor invidunt ut labore et dolore
                      magna aliquyam erat, sed diam voluptua.
                    </p>

                    <div className="mb-4">
                      <InputAdd
                        name="seekings"
                        label="Suche"
                        readOnly
                        placeholder="Noch nicht implementiert"
                        entries={profile.seekings ?? []}
                        isPublic={profile.publicFields?.includes("seekings")}
                      />
                    </div>

                    <hr className="border-neutral-400 mb-16" />

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
