import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
  redirect,
} from "react-router";
import { FormProvider, useForm } from "react-hook-form";
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
import { TextArea } from "~/components-next/TextArea";
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
import { detectLanguage } from "~/i18n.server";
import { getAllOffers } from "~/routes/utils.server";
import { getAreas } from "~/utils.server";
import {
  deriveProfileMode,
  getProfileVisibilitiesById,
  getWholeProfileFromUsername,
  updateProfileById,
} from "../utils.server";
import {
  type GeneralProfileSettingsLocales,
  getProfileByUsername,
} from "./general.server";
import { languageModuleMap } from "~/locales/.server";
import { RichText } from "~/components/Richtext/RichText";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { createRef, useEffect } from "react";

const BIO_MAX_LENGTH = 500;

const createProfileSchema = (locales: GeneralProfileSettingsLocales) => {
  return object({
    academicTitle: nullOrString(string()),
    position: nullOrString(string()),
    firstName: string().required(locales.route.validation.firstName.required),
    lastName: string().required(locales.route.validation.lastName.required),
    email: string().email().required(),
    email2: nullOrString(string().email()),
    phone: nullOrString(phone()),
    bio: nullOrString(multiline(BIO_MAX_LENGTH)),
    bioRTEState: nullOrString(
      string().transform((value: string | null | undefined) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      })
    ),
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
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/general"];
  const username = getParamValueOrThrow(params, "username");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", locales.route.error.notPrivileged, {
    status: 403,
  });
  const dbProfile = await getWholeProfileFromUsername(username);
  if (dbProfile === null) {
    invariantResponse(false, locales.route.error.profileNotFound, {
      status: 404,
    });
  }
  const profileVisibilities = await getProfileVisibilitiesById(dbProfile.id);
  if (profileVisibilities === null) {
    invariantResponse(false, locales.route.error.noVisibilities, {
      status: 404,
    });
  }

  const profile = makeFormProfileFromDbProfile(dbProfile);

  const areas = await getAreas();
  const offers = await getAllOffers();

  return { profile, profileVisibilities, areas, offers, locales };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/general"];
  const { authClient } = createAuthClient(request);
  const username = getParamValueOrThrow(params, "username");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    invariantResponse(false, locales.route.error.profileNotFound, {
      status: 404,
    });
  }
  const formData = await request.clone().formData();

  const schema = createProfileSchema(locales);

  const parsedFormData = await getFormValues<ProfileSchemaType>(
    request,
    schema
  );

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
    invariantResponse(false, locales.route.error.validationFailed, {
      status: 400,
    });
  }

  let updated = false;

  const submit = formData.get("submit");
  if (submit === "submit") {
    if (errors === null) {
      try {
        const { privateFields, ...profileData } = data;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore TODO: fix type issue
        await updateProfileById(profile.id, profileData, privateFields);
        updated = true;
      } catch (error) {
        console.error(error);
        invariantResponse(false, locales.route.error.serverError, {
          status: 500,
        });
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
  return {
    profile: data,
    lastSubmit: (formData.get("submit") as string) ?? "",
    errors,
    updated,
  };
};

export default function Index() {
  const { username } = useParams();
  const navigation = useNavigation();
  const {
    profile: dbProfile,
    areas,
    offers,
    profileVisibilities,
    locales,
  } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const profile = actionData?.profile ?? dbProfile;
  const formRef = createRef<HTMLFormElement>();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors;
  const methods = useForm<ProfileFormType>({
    defaultValues: profile,
  });
  const {
    register,
    reset,
    formState: { isDirty },
  } = methods;

  const areaOptions = createAreaOptionFromData(areas);
  const offerOptions = offers.map((offer) => {
    let title;
    if (offer.slug in locales.offers) {
      type LocaleKey = keyof typeof locales.offers;
      title = locales.offers[offer.slug as LocaleKey].title;
    } else {
      console.error(`Offer ${offer.slug} not found in locales`);
      title = offer.slug;
    }
    return {
      label: title,
      value: offer.id,
    };
  });

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
          .sort((currentOffer, nextOffer) => {
            let currentTitle;
            let nextTitle;
            if (currentOffer.slug in locales.offers) {
              type LocaleKey = keyof typeof locales.offers;
              currentTitle =
                locales.offers[currentOffer.slug as LocaleKey].title;
            } else {
              console.error(`Focus ${currentOffer.slug} not found in locales`);
              currentTitle = currentOffer.slug;
            }
            if (nextOffer.slug in locales.offers) {
              type LocaleKey = keyof typeof locales.offers;
              nextTitle = locales.offers[nextOffer.slug as LocaleKey].title;
            } else {
              console.error(`Focus ${nextOffer.slug} not found in locales`);
              nextTitle = nextOffer.slug;
            }
            return currentTitle.localeCompare(nextTitle);
          })
      : [];

  const selectedSeekings =
    profile.seekings && offers
      ? offers
          .filter((offer) => profile.seekings.includes(offer.id))
          .sort((currentOffer, nextOffer) => {
            let currentTitle;
            let nextTitle;
            if (currentOffer.slug in locales.offers) {
              type LocaleKey = keyof typeof locales.offers;
              currentTitle =
                locales.offers[currentOffer.slug as LocaleKey].title;
            } else {
              console.error(`Focus ${currentOffer.slug} not found in locales`);
              currentTitle = currentOffer.slug;
            }
            if (nextOffer.slug in locales.offers) {
              type LocaleKey = keyof typeof locales.offers;
              nextTitle = locales.offers[nextOffer.slug as LocaleKey].title;
            } else {
              console.error(`Focus ${nextOffer.slug} not found in locales`);
              nextTitle = nextOffer.slug;
            }
            return currentTitle.localeCompare(nextTitle);
          })
      : [];

  useEffect(() => {
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

  useEffect(() => {
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
          onSubmit={() => {
            reset({}, { keepValues: true });
          }}
        >
          <fieldset>
            <h1 className="mv-mb-8">Persönliche Daten</h1>

            <h4 className="mv-mb-4 mv-font-semibold">
              {locales.route.general.headline}
            </h4>

            <p className="mv-mb-8">{locales.route.general.intro}</p>

            <div className="mv-flex mv-flex-col @md:mv-flex-row mv--mx-4">
              <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-4">
                <SelectField
                  {...register("academicTitle")}
                  label={locales.route.general.form.title.label}
                  options={[
                    {
                      label: locales.route.general.form.title.options.dr,
                      value: "Dr.",
                    },
                    {
                      label: locales.route.general.form.title.options.prof,
                      value: "Prof.",
                    },
                    {
                      label: locales.route.general.form.title.options.profdr,
                      value: "Prof. Dr.",
                    },
                  ]}
                  withPublicPrivateToggle={false}
                  isPublic={profileVisibilities.academicTitle}
                  defaultValue={profile.academicTitle || ""}
                />
              </div>
              <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-4">
                <InputText
                  {...register("position")}
                  id="position"
                  label={locales.route.general.form.position.label}
                  withPublicPrivateToggle={true}
                  isPublic={profileVisibilities.position}
                  errorMessage={errors?.position?.message}
                />
              </div>
            </div>

            <div className="mv-flex mv-flex-col @md:mv-flex-row mv--mx-4">
              <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-4">
                <InputText
                  {...register("firstName")}
                  id="firstName"
                  label={locales.route.general.form.firstName.label}
                  required
                  withPublicPrivateToggle={false}
                  isPublic={profileVisibilities.firstName}
                  errorMessage={errors?.firstName?.message}
                />
              </div>
              <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-4">
                <InputText
                  {...register("lastName")}
                  id="lastName"
                  label={locales.route.general.form.lastName.label}
                  required
                  withPublicPrivateToggle={false}
                  isPublic={profileVisibilities.lastName}
                  errorMessage={errors?.lastName?.message}
                />
              </div>
            </div>

            <div className="mv-flex mv-flex-col @md:mv-flex-row mv--mx-4 mv-flex-wrap">
              <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-4">
                <InputText
                  {...register("email")}
                  type="text"
                  id="email"
                  label={locales.route.general.form.email.label}
                  readOnly
                  withPublicPrivateToggle={true}
                  isPublic={profileVisibilities.email}
                  errorMessage={errors?.email?.message}
                  className="mv-text-neutral-300 mv-pointer-events-none"
                />
                <div className="mv-text-sm mv-mt-2">
                  {insertComponentsIntoLocale(
                    locales.route.general.form.email.helperText,
                    [
                      <Link
                        key="link-to-security-settings"
                        to={`/profile/${username}/settings/security`}
                        className="mv-text-primary hover:mv-underline"
                      />,
                    ]
                  )}
                </div>
              </div>
              <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-4">
                <InputText
                  {...register("email2")}
                  type="text"
                  id="email2"
                  label={locales.route.general.form.email2.label}
                  withPublicPrivateToggle={true}
                  isPublic={profileVisibilities.email2}
                  errorMessage={errors?.email2?.message}
                />
              </div>
              <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-4">
                <InputText
                  {...register("phone")}
                  id="phone"
                  label={locales.route.general.form.phone.label}
                  withPublicPrivateToggle={true}
                  isPublic={profileVisibilities.phone}
                  errorMessage={errors?.phone?.message}
                />
              </div>
            </div>

            <hr className="mv-border-neutral-400 mv-my-10 @lg:mv-my-16" />

            <div className="mv-flex mv-flex-row mv-items-center mv-mb-4">
              <h4 className="mv-font-semibold">
                {locales.route.aboutMe.headline}
              </h4>
            </div>

            <p className="mv-mb-8">{locales.route.aboutMe.intro}</p>

            <div className="mv-mb-4">
              <TextArea
                {...register("bio")}
                id="bio"
                label={locales.route.aboutMe.form.description.label}
                defaultValue={profile.bio || ""}
                placeholder={locales.route.aboutMe.form.description.placeholder}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.bio}
                errorMessage={errors?.bio?.message}
                maxLength={BIO_MAX_LENGTH}
                rte={{
                  locales: locales,
                  defaultValue: profile.bioRTEState || undefined,
                  legacyFormRegister: register("bioRTEState"),
                }}
              />
            </div>

            <div className="mv-mb-4">
              <SelectAdd
                name="areas"
                label={locales.route.aboutMe.form.activityAreas.label}
                placeholder={
                  locales.route.aboutMe.form.activityAreas.placeholder
                }
                entries={selectedAreas.map((area) => ({
                  label: area.name,
                  value: area.id,
                }))}
                options={areaOptions}
                withPublicPrivateToggle={false}
                isPublic={profileVisibilities.areas}
              />
            </div>

            <div className="mv-mb-4">
              <InputAdd
                name="skills"
                label={locales.route.aboutMe.form.skills.label}
                placeholder={locales.route.aboutMe.form.skills.placeholder}
                entries={profile.skills ?? []}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.skills}
              />
            </div>

            <div className="mv-mb-4">
              <InputAdd
                name="interests"
                label={locales.route.aboutMe.form.interests.label}
                placeholder={locales.route.aboutMe.form.interests.placeholder}
                entries={profile.interests ?? []}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.interests}
              />
            </div>

            <hr className="mv-border-neutral-400 mv-my-10 @lg:mv-my-16" />
            <h4 className="mv-mb-4 mv-font-semibold">
              {locales.route.offer.headline}
            </h4>

            <p className="mv-mb-8">{locales.route.offer.intro}</p>

            <div className="mv-mb-4">
              <SelectAdd
                name="offers"
                label={locales.route.offer.form.quote.label}
                entries={selectedOffers.map((offer) => {
                  let title;
                  if (offer.slug in locales.offers) {
                    type LocaleKey = keyof typeof locales.offers;
                    title = locales.offers[offer.slug as LocaleKey].title;
                  } else {
                    console.error(`Offer ${offer.slug} not found in locales`);
                    title = offer.slug;
                  }
                  return {
                    label: title,
                    value: offer.id,
                  };
                })}
                options={offerOptions.filter(
                  (offer) => !profile.offers.includes(offer.value)
                )}
                placeholder={locales.route.offer.form.quote.placeholder}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.offers}
              />
            </div>

            <hr className="mv-border-neutral-400 mv-my-10 @lg:mv-my-16" />

            <h4 className="mv-mb-4 mv-font-semibold">
              {locales.route.lookingFor.headline}
            </h4>

            <p className="mv-mb-8">{locales.route.lookingFor.intro}</p>

            <div className="mv-mb-4">
              <SelectAdd
                name="seekings"
                label={locales.route.lookingFor.form.seeking.label}
                entries={selectedSeekings.map((seeking) => {
                  let title;
                  if (seeking.slug in locales.offers) {
                    type LocaleKey = keyof typeof locales.offers;
                    title = locales.offers[seeking.slug as LocaleKey].title;
                  } else {
                    console.error(`Offer ${seeking.slug} not found in locales`);
                    title = seeking.slug;
                  }
                  return {
                    label: title,
                    value: seeking.id,
                  };
                })}
                options={offerOptions.filter(
                  (offer) => !profile.seekings.includes(offer.value)
                )}
                placeholder={locales.route.lookingFor.form.seeking.placeholder}
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.seekings}
              />
            </div>

            <hr className="mv-border-neutral-400 mv-my-10 @lg:mv-my-16" />

            <h2 className="mv-mb-8">
              {locales.route.websiteSocialMedia.headline}
            </h2>

            <h4 className="mv-mb-4 mv-font-semibold">
              {locales.route.websiteSocialMedia.website.headline}
            </h4>

            <p className="mv-mb-8">
              {locales.route.websiteSocialMedia.website.intro}
            </p>

            <div className="mv-basis-full mv-mb-4">
              <InputText
                {...register("website")}
                id="website"
                label={
                  locales.route.websiteSocialMedia.website.form.website.label
                }
                placeholder={
                  locales.route.websiteSocialMedia.website.form.website
                    .placeholder
                }
                withPublicPrivateToggle={true}
                isPublic={profileVisibilities.website}
                errorMessage={errors?.website?.message}
                withClearButton
              />
            </div>

            <hr className="mv-border-neutral-400 mv-my-10 @lg:mv-my-16" />

            <h4 className="mv-mb-4 mv-font-semibold">
              {locales.route.websiteSocialMedia.socialMedia.headline}
            </h4>

            <p className="mv-mb-8">
              {locales.route.websiteSocialMedia.socialMedia.intro}
            </p>

            {createSocialMediaServices(locales).map((service) => (
              <div className="mv-w-full mv-mb-4" key={service.id}>
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

            <hr className="mv-border-neutral-400 mv-my-10 @lg:mv-my-16" />

            <div className="mv-flex mv-flex-col mv-justify-start @sm:mv-items-center mv-mb-4 @sm:mv-flex-row mv-gap-2 @sm:mv-gap-4">
              <h4 className="mv-font-semibold">
                {locales.route.network.headline}
              </h4>
              <Link
                to="/organization/create"
                className="mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-[.375rem] mv-px-6 mv-normal-case mv-leading-[1.125rem] mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-text-sm mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
              >
                {locales.route.network.action}
              </Link>
            </div>

            <RichText
              html={locales.route.network.intro}
              additionalClassNames="mv-mb-4"
            />

            <footer className="mv-fixed mv-bg-white mv-border-t-2 mv-border-primary mv-w-full mv-inset-x-0 mv-bottom-0">
              <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
                <div className="mv-flex mv-flex-row mv-flex-nowrap mv-items-center mv-justify-end mv-my-4">
                  <div
                    className={`mv-text-green-500 mv-text-bold ${
                      actionData?.updated && !isSubmitting
                        ? "mv-block"
                        : "mv-hidden"
                    }`}
                  >
                    {locales.route.footer.profileUpdated}
                  </div>

                  {isFormChanged ? (
                    <Link
                      to={`/profile/${username}/settings`}
                      reloadDocument
                      className="mv-text-primary mv-underline mv-text-sm mv-font-semibold"
                    >
                      {locales.route.footer.ignoreChanges}
                    </Link>
                  ) : null}
                  <button
                    type="submit"
                    name="submit"
                    value="submit"
                    className="mv-ml-4 mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                  >
                    {locales.route.footer.save}
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
