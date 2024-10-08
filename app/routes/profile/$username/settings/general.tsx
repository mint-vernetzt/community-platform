import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
} from "@remix-run/react";
import { type TFunction } from "i18next";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import quillStyles from "react-quill/dist/quill.snow.css";
import type { InferType } from "yup";
import { array, object, string } from "yup";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import InputAdd from "~/components/FormElements/InputAdd/InputAdd";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import SelectField from "~/components/FormElements/SelectField/SelectField";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import i18next from "~/i18next.server";
import {
  createAreaOptionFromData,
  objectListOperationResolver,
} from "~/lib/utils/components";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { createSocialMediaServices } from "~/lib/utils/socialMediaServices";
import type { FormError } from "~/lib/utils/yup";
import {
  getFormValues,
  multiline,
  nullOrString,
  phone,
  social,
  validateForm,
  website,
} from "~/lib/utils/yup";
import { detectLanguage } from "~/root.server";
import { getAllOffers } from "~/routes/utils.server";
import { getAreas } from "~/utils.server";
import {
  deriveProfileMode,
  getProfileVisibilitiesById,
  getWholeProfileFromUsername,
  updateProfileById,
} from "../utils.server";
import { getProfileByUsername } from "./general.server";

const i18nNS = ["routes/profile/settings/general", "datasets/offers"];
export const handle = {
  i18n: i18nNS,
};

const createProfileSchema = (t: TFunction) => {
  return object({
    academicTitle: nullOrString(string()),
    position: nullOrString(string()),
    firstName: string().required(t("validation.firstName.required")),
    lastName: string().required(t("validation.lastName.required")),
    email: string().email().required(),
    email2: nullOrString(string().email()),
    phone: nullOrString(phone()),
    bio: nullOrString(multiline()),
    areas: array(string().required()).required(),
    skills: array(string().required()).required(),
    offers: array(string().required()).required(),
    interests: array(string().required()).required(),
    seekings: array(string().required()).required(),
    privateFields: array(string().required()).required(),
    website: nullOrString(website()),
    facebook: nullOrString(social("facebook")),
    linkedin: nullOrString(social("linkedin")),
    twitter: nullOrString(social("twitter")),
    youtube: nullOrString(social("youtube")),
    instagram: nullOrString(social("instagram")),
    xing: nullOrString(social("xing")),
    mastodon: nullOrString(social("mastodon")),
    tiktok: nullOrString(social("tiktok")),
  });
};

type ProfileSchemaType = ReturnType<typeof createProfileSchema>;
export type ProfileFormType = InferType<ProfileSchemaType>;

function makeFormProfileFromDbProfile(
  dbProfile: NonNullable<
    Awaited<ReturnType<typeof getWholeProfileFromUsername>>
  >
) {
  return {
    ...dbProfile,
    areas: dbProfile.areas.map((area) => area.area.id),
    offers: dbProfile.offers.map((offer) => offer.offer.id),
    seekings: dbProfile.seekings.map((seeking) => seeking.offer.id),
  };
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/profile/settings/general",
  ]);
  const username = getParamValueOrThrow(params, "username");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", t("error.notPrivileged"), {
    status: 403,
  });
  const dbProfile = await getWholeProfileFromUsername(username);
  if (dbProfile === null) {
    throw json({ message: t("error.profileNotFound") }, { status: 404 });
  }
  const profileVisibilities = await getProfileVisibilitiesById(dbProfile.id);
  if (profileVisibilities === null) {
    throw json({ message: t("error.noVisibilities") }, { status: 404 });
  }

  const profile = makeFormProfileFromDbProfile(dbProfile);

  const areas = await getAreas();
  const offers = await getAllOffers();

  return json({ profile, profileVisibilities, areas, offers });
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: quillStyles },
];

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/profile/settings/general",
  ]);
  const { authClient } = createAuthClient(request);
  const username = getParamValueOrThrow(params, "username");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw json({ message: t("error.profileNotFound") }, { status: 404 });
  }
  const formData = await request.clone().formData();

  const schema = createProfileSchema(t);

  let parsedFormData = await getFormValues<ProfileSchemaType>(request, schema);

  let errors: FormError | null;
  let data: ProfileFormType;

  try {
    const result = await validateForm<ProfileSchemaType>(
      schema,
      parsedFormData
    );

    errors = result.errors;
    data = result.data;
  } catch (error) {
    console.error(error);
    throw json({ message: t("error.validationFailed") }, { status: 400 });
  }

  let updated = false;

  const submit = formData.get("submit");
  if (submit === "submit") {
    if (errors === null) {
      try {
        const { privateFields, ...profileData } = data;
        // @ts-ignore TODO: fix type issue
        await updateProfileById(profile.id, profileData, privateFields);
        updated = true;
      } catch (error) {
        console.error(error);
        throw json({ message: t("error.serverError") }, { status: 500 });
      }
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
      data = objectListOperationResolver<ProfileFormType>(data, name, formData);
    });
  }
  return json({
    profile: data,
    lastSubmit: (formData.get("submit") as string) ?? "",
    errors,
    updated,
  });
};

export default function Index() {
  const { username } = useParams();
  const { t } = useTranslation(i18nNS);
  const navigation = useNavigation();
  const {
    profile: dbProfile,
    areas,
    offers,
    profileVisibilities,
  } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const profile = actionData?.profile ?? dbProfile;

  const formRef = React.createRef<HTMLFormElement>();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors;
  const methods = useForm<ProfileFormType>({
    defaultValues: profile,
  });

  const areaOptions = createAreaOptionFromData(areas);
  const offerOptions = offers.map((o) => ({
    label: t(`${o.slug}.title`, { ns: "datasets/offers" }),
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
          .sort((a, b) =>
            t(`${a.slug}.title`, { ns: "datasets/offers" }).localeCompare(
              t(`${b.slug}.title`, { ns: "datasets/offers" })
            )
          )
      : [];

  const selectedSeekings =
    profile.seekings && offers
      ? offers
          .filter((offer) => profile.seekings.includes(offer.id))
          .sort((a, b) =>
            t(`${a.slug}.title`, { ns: "datasets/offers" }).localeCompare(
              t(`${b.slug}.title`, { ns: "datasets/offers" })
            )
          )
      : [];

  React.useEffect(() => {
    if (isSubmitting) {
      const $inputsToClear =
        formRef?.current?.getElementsByClassName("clear-after-submit");
      if ($inputsToClear) {
        Array.from($inputsToClear).forEach(
          // TODO: can this type assertion be removed and proofen by code?
          (a) => ((a as HTMLInputElement).value = "")
        );
      }
    }
  }, [isSubmitting, formRef]);

  React.useEffect(() => {
    if (
      actionData?.lastSubmit === "submit" &&
      actionData?.errors !== undefined &&
      actionData?.errors !== null
    ) {
      const errorElement = document.getElementsByName(
        Object.keys(actionData.errors)[0]
      );
      const yPosition =
        errorElement[0].getBoundingClientRect().top -
        document.body.getBoundingClientRect().top -
        window.innerHeight / 2;
      window.scrollTo(0, yPosition);

      errorElement[0].focus({ preventScroll: true });
    }
  }, [actionData]);

  const isFormChanged = isDirty || actionData?.updated === false;

  return (
    <>
      <FormProvider {...methods}>
        <Form
          ref={formRef}
          name="profileForm"
          method="post"
          onSubmit={(e: React.SyntheticEvent) => {
            reset({}, { keepValues: true });
          }}
        >
          <fieldset disabled={navigation.state === "submitting"}>
            <h1 className="mb-8">Persönliche Daten</h1>

            <h4 className="mb-4 font-semibold">{t("general.headline")}</h4>

            <p className="mb-8">{t("general.intro")}</p>

            <div className="flex flex-col @md:mv-flex-row -mx-4">
              <div className="basis-full @md:mv-basis-6/12 px-4 mb-4">
                <SelectField
                  {...register("academicTitle")}
                  label={t("general.form.title.label")}
                  options={[
                    {
                      label: t("general.form.title.options.dr"),
                      value: "Dr.",
                    },
                    {
                      label: t("general.form.title.options.prof"),
                      value: "Prof.",
                    },
                    {
                      label: t("general.form.title.options.profdr"),
                      value: "Prof. Dr.",
                    },
                  ]}
                  withPublicPrivateToggle={false}
                  isPublic={profileVisibilities.academicTitle}
                  defaultValue={profile.academicTitle || ""}
                />
              </div>
              <div className="basis-full @md:mv-basis-6/12 px-4 mb-4">
                <InputText
                  {...register("position")}
                  id="position"
                  label={t("general.form.position.label")}
                  withPublicPrivateToggle={true}
                  isPublic={profileVisibilities.position}
                  errorMessage={errors?.position?.message}
                />
              </div>
            </div>

            <div className="flex flex-col @md:mv-flex-row -mx-4">
              <div className="basis-full @md:mv-basis-6/12 px-4 mb-4">
                <InputText
                  {...register("firstName")}
                  id="firstName"
                  label={t("general.form.firstName.label")}
                  required
                  withPublicPrivateToggle={false}
                  isPublic={profileVisibilities.firstName}
                  errorMessage={errors?.firstName?.message}
                />
              </div>
              <div className="basis-full @md:mv-basis-6/12 px-4 mb-4">
                <InputText
                  {...register("lastName")}
                  id="lastName"
                  label={t("general.form.lastName.label")}
                  required
                  withPublicPrivateToggle={false}
                  isPublic={profileVisibilities.lastName}
                  errorMessage={errors?.lastName?.message}
                />
              </div>
            </div>

            <div className="flex flex-col @md:mv-flex-row -mx-4 mv-flex-wrap">
              <div className="basis-full @md:mv-basis-6/12 px-4 mb-4">
                <InputText
                  {...register("email")}
                  type="text"
                  id="email"
                  label={t("general.form.email.label")}
                  readOnly
                  withPublicPrivateToggle={true}
                  isPublic={profileVisibilities.email}
                  errorMessage={errors?.email?.message}
                />
              </div>
              <div className="basis-full @md:mv-basis-6/12 px-4 mb-4">
                <InputText
                  {...register("email2")}
                  type="text"
                  id="email2"
                  label={t("general.form.email2.label")}
                  withPublicPrivateToggle={true}
                  isPublic={profileVisibilities.email2}
                  errorMessage={errors?.email2?.message}
                />
              </div>
              <div className="basis-full @md:mv-basis-6/12 px-4 mb-4">
                <InputText
                  {...register("phone")}
                  id="phone"
                  label={t("general.form.phone.label")}
                  withPublicPrivateToggle={true}
                  isPublic={profileVisibilities.phone}
                  errorMessage={errors?.phone?.message}
                />
              </div>
            </div>

            <hr className="border-neutral-400 my-10 @lg:mv-my-16" />

            <div className="flex flex-row items-center mb-4">
              <h4 className="font-semibold">{t("aboutMe.headline")}</h4>
            </div>

            <p className="mb-8">{t("aboutMe.intro")}</p>

            <div className="mb-4">
              <TextAreaWithCounter
                {...register("bio")}
                id="bio"
                label={t("aboutMe.form.description.label")}
                defaultValue={profile.bio || ""}
                placeholder={t("aboutMe.form.description.placeholder")}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.bio}
                errorMessage={errors?.bio?.message}
                maxCharacters={500}
                rte
              />
            </div>

            <div className="mb-4">
              <SelectAdd
                name="areas"
                label={t("aboutMe.form.activityAreas.label")}
                placeholder={t("aboutMe.form.activityAreas.placeholder")}
                entries={selectedAreas.map((area) => ({
                  label: area.name,
                  value: area.id,
                }))}
                options={areaOptions}
                withPublicPrivateToggle={false}
                isPublic={profileVisibilities.areas}
              />
            </div>

            <div className="mb-4">
              <InputAdd
                name="skills"
                label={t("aboutMe.form.skills.label")}
                placeholder={t("aboutMe.form.skills.placeholder")}
                entries={profile.skills ?? []}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.skills}
              />
            </div>

            <div className="mb-4">
              <InputAdd
                name="interests"
                label={t("aboutMe.form.interests.label")}
                placeholder={t("aboutMe.form.interests.placeholder")}
                entries={profile.interests ?? []}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.interests}
              />
            </div>

            <hr className="border-neutral-400 my-10 @lg:mv-my-16" />
            <h4 className="mb-4 font-semibold">{t("offer.headline")}</h4>

            <p className="mb-8">{t("offer.intro")}</p>

            <div className="mb-4">
              <SelectAdd
                name="offers"
                label={t("offer.form.quote.label")}
                entries={selectedOffers.map((offer) => ({
                  label: t(`${offer.slug}.title`, { ns: "datasets/offers" }),
                  value: offer.id,
                }))}
                options={offerOptions.filter(
                  (o) => !profile.offers.includes(o.value)
                )}
                placeholder={t("offer.form.quote.placeholder")}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.offers}
              />
            </div>

            <hr className="border-neutral-400 my-10 @lg:mv-my-16" />

            <h4 className="mb-4 font-semibold">{t("lookingFor.headline")}</h4>

            <p className="mb-8">{t("lookingFor.intro")}</p>

            <div className="mb-4">
              <SelectAdd
                name="seekings"
                label={t("lookingFor.form.seeking.label")}
                entries={selectedSeekings.map((seeking) => ({
                  label: t(`${seeking.slug}.title`, { ns: "datasets/offers" }),
                  value: seeking.id,
                }))}
                options={offerOptions.filter(
                  (o) => !profile.seekings.includes(o.value)
                )}
                placeholder={t("lookingFor.form.seeking.placeholder")}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.seekings}
              />
            </div>

            <hr className="border-neutral-400 my-10 @lg:mv-my-16" />

            <h2 className="mb-8">{t("websiteSocialMedia.headline")}</h2>

            <h4 className="mb-4 font-semibold">
              {t("websiteSocialMedia.website.headline")}
            </h4>

            <p className="mb-8">{t("websiteSocialMedia.website.intro")}</p>

            <div className="basis-full mb-4">
              <InputText
                {...register("website")}
                id="website"
                label={t("websiteSocialMedia.website.form.website.label")}
                placeholder={t(
                  "websiteSocialMedia.website.form.website.placeholder"
                )}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.website}
                errorMessage={errors?.website?.message}
                withClearButton
              />
            </div>

            <hr className="border-neutral-400 my-10 @lg:mv-my-16" />

            <h4 className="mb-4 font-semibold">
              {t("websiteSocialMedia.socialMedia.headline")}
            </h4>

            <p className="mb-8">{t("websiteSocialMedia.socialMedia.intro")}</p>

            {createSocialMediaServices(t).map((service) => (
              <div className="w-full mb-4" key={service.id}>
                <InputText
                  {...register(service.id)}
                  id={service.id}
                  label={service.label}
                  placeholder={service.placeholder}
                  withPublicPrivateToggle={true}
                  isPublic={profileVisibilities[service.id]}
                  errorMessage={errors?.[service.id]?.message}
                  withClearButton
                />
              </div>
            ))}

            <hr className="border-neutral-400 my-10 @lg:mv-my-16" />

            <div className="mv-flex mv-flex-col mv-justify-start @sm:mv-items-center mv-mb-4 @sm:mv-flex-row mv-gap-2 @sm:mv-gap-4">
              <h4 className="font-semibold">{t("network.headline")}</h4>
              <Link
                to="/organization/create"
                className="btn btn-outline-primary btn-small"
              >
                {t("network.action")}
              </Link>
            </div>
            <p className="mv-mb-4">
              <Trans i18nKey="network.intro" ns={i18nNS} />
            </p>

            <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
              <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
                <div className="flex flex-row flex-nowrap items-center justify-end my-4">
                  <div
                    className={`text-green-500 text-bold ${
                      actionData?.updated && !isSubmitting
                        ? "block animate-fade-out"
                        : "hidden"
                    }`}
                  >
                    {t("footer.profileUpdated")}
                  </div>

                  {isFormChanged ? (
                    <Link
                      to={`/profile/${username}/settings`}
                      reloadDocument
                      className={`btn btn-link`}
                    >
                      {t("footer.ignoreChanges")}
                    </Link>
                  ) : null}
                  <div></div>
                  <button
                    type="submit"
                    name="submit"
                    value="submit"
                    className="btn btn-primary ml-4"
                    disabled={isSubmitting || !isFormChanged}
                  >
                    {t("footer.save")}
                  </button>
                </div>
              </div>
            </footer>
          </fieldset>
        </Form>
      </FormProvider>
    </>
  );
}
