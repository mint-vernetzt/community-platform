import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
} from "@remix-run/react";
import React from "react";
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
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import {
  createAreaOptionFromData,
  objectListOperationResolver,
} from "~/lib/utils/components";
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
import { getAreas, getFocuses } from "~/utils.server";
import {
  deriveOrganizationMode,
  getOrganizationVisibilitiesById,
} from "../utils.server";
import {
  getOrganizationTypes,
  getWholeOrganizationBySlug,
  updateOrganizationById,
} from "./utils.server";
import quillStyles from "react-quill/dist/quill.snow.css?url";
import { invariantResponse } from "~/lib/utils/response";
import { detectLanguage } from "~/i18n.server";
import {
  type GeneralOrganizationSettingsLocales,
  getOrganizationBySlug,
} from "./general.server";
import { languageModuleMap } from "~/locales/.server";

const createOrganizationSchema = (
  locales: GeneralOrganizationSettingsLocales
) => {
  return object({
    name: string().required(locales.route.validation.name.required),
    email: nullOrString(string().email(locales.route.validation.email.email)),
    phone: nullOrString(phone()),
    street: nullOrString(string()),
    streetNumber: nullOrString(string()),
    zipCode: nullOrString(string()),
    city: nullOrString(string()),
    website: nullOrString(website()),
    facebook: nullOrString(social("facebook")),
    linkedin: nullOrString(social("linkedin")),
    twitter: nullOrString(social("twitter")),
    youtube: nullOrString(social("youtube")),
    instagram: nullOrString(social("instagram")),
    xing: nullOrString(social("xing")),
    mastodon: nullOrString(social("mastodon")),
    tiktok: nullOrString(social("tiktok")),
    bio: nullOrString(multiline()),
    types: array(string().required()).required(),
    quote: nullOrString(multiline()),
    quoteAuthor: nullOrString(string()),
    quoteAuthorInformation: nullOrString(string()),
    supportedBy: array(string().required()).required(),
    privateFields: array(string().required()).required(),
    areas: array(string().required()).required(),
    focuses: array(string().required()).required(),
  });
};

type OrganizationSchemaType = ReturnType<typeof createOrganizationSchema>;
type OrganizationFormType = InferType<OrganizationSchemaType>;

function makeFormOrganizationFromDbOrganization(
  dbOrganization: NonNullable<
    Awaited<ReturnType<typeof getWholeOrganizationBySlug>>
  >
) {
  return {
    ...dbOrganization,
    areas: dbOrganization.areas.map((area) => area.areaId) ?? [],
    types: dbOrganization.types.map((type) => type.organizationTypeId) ?? [],
    focuses: dbOrganization.focuses.map((focus) => focus.focusId) ?? [],
  };
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/general"];
  const { authClient } = createAuthClient(request);

  const slug = getParamValueOrThrow(params, "slug");

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  const dbOrganization = await getWholeOrganizationBySlug(slug);
  if (dbOrganization === null) {
    invariantResponse(false, locales.route.error.notFound.named, {
      status: 404,
    });
  }
  const organizationVisibilities = await getOrganizationVisibilitiesById(
    dbOrganization.id
  );
  if (organizationVisibilities === null) {
    invariantResponse(false, locales.route.error.notFound.visibilities, {
      status: 404,
    });
  }

  const organization = makeFormOrganizationFromDbOrganization(dbOrganization);

  const organizationTypes = await getOrganizationTypes();
  const focuses = await getFocuses();
  const areas = await getAreas();

  return {
    organization,
    organizationVisibilities,
    organizationTypes,
    areas,
    focuses,
    locales,
  };
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: quillStyles },
];

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/general"];
  const { authClient } = createAuthClient(request);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.route.error.notPrivileged, {
    status: 403,
  });
  const organization = await getOrganizationBySlug(slug);
  invariantResponse(organization, locales.route.error.notFound.organization, {
    status: 404,
  });

  const parsedFormData = await getFormValues<OrganizationSchemaType>(
    request,
    createOrganizationSchema(locales)
  );

  let errors: FormError | null;
  let data: OrganizationFormType;

  try {
    let result = await validateForm<OrganizationSchemaType>(
      createOrganizationSchema(locales),
      parsedFormData
    );
    errors = result.errors;
    data = result.data;
  } catch (error) {
    console.error(error);
    invariantResponse(false, locales.route.error.validation, { status: 400 });
  }

  let updated = false;

  const formData = await request.clone().formData();
  const submit = formData.get("submit");
  if (submit === "submit") {
    if (errors === null) {
      try {
        const { privateFields, ...organizationData } = data;
        await updateOrganizationById(
          organization.id,
          // @ts-ignore TODO: fix type issue
          organizationData,
          privateFields
        );
        updated = true;
      } catch (error) {
        console.error(error);
        invariantResponse(false, locales.route.error.serverError, {
          status: 500,
        });
      }
    }
  } else {
    const listData: (keyof OrganizationFormType)[] = [
      "types",
      "focuses",
      "supportedBy",
      "areas",
    ];

    listData.forEach((key) => {
      data = objectListOperationResolver<OrganizationFormType>(
        data,
        key,
        formData
      );
    });
  }

  return {
    organization: data,
    lastSubmit: (formData.get("submit") as string) ?? "",
    updated,
    errors,
  };
};

function Index() {
  const { slug } = useParams();
  const {
    organization: dbOrganization,
    organizationVisibilities,
    organizationTypes,
    areas,
    focuses,
    locales,
  } = useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();

  const formRef = React.createRef<HTMLFormElement>();
  const isSubmitting = navigation.state === "submitting";

  const organization = actionData?.organization ?? dbOrganization;

  const methods = useForm<OrganizationFormType>({
    defaultValues: organization,
  });

  const {
    register,
    reset,
    formState: { isDirty },
  } = methods;

  const errors = actionData?.errors;

  const organizationTypesOptions = organizationTypes.map((type) => {
    let title;
    if (type.slug in locales.organizationTypes) {
      type LocaleKey = keyof typeof locales.organizationTypes;
      title = locales.organizationTypes[type.slug as LocaleKey].title;
    } else {
      console.error(`Focus ${type.slug} not found in locales`);
      title = type.slug;
    }
    return {
      label: title,
      value: type.id,
    };
  });

  const selectedOrganizationTypes =
    organization.types && organizationTypes
      ? organizationTypes
          .filter((type) => organization.types.includes(type.id))
          .sort((currentType, nextType) => {
            let currentTitle;
            let nextTitle;
            if (currentType.slug in locales.organizationTypes) {
              type LocaleKey = keyof typeof locales.organizationTypes;
              currentTitle =
                locales.organizationTypes[currentType.slug as LocaleKey].title;
            } else {
              console.error(
                `Organization type ${currentType.slug} not found in locales`
              );
              currentTitle = currentType.slug;
            }
            if (nextType.slug in locales.organizationTypes) {
              type LocaleKey = keyof typeof locales.organizationTypes;
              nextTitle =
                locales.organizationTypes[nextType.slug as LocaleKey].title;
            } else {
              console.error(
                `Organization type ${nextType.slug} not found in locales`
              );
              nextTitle = nextType.slug;
            }
            return currentTitle.localeCompare(nextTitle);
          })
      : [];

  const selectedAreas =
    organization.areas && areas
      ? areas
          .filter((area) => organization.areas.includes(area.id))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

  const areaOptions = createAreaOptionFromData(areas);

  const focusOptions = focuses.map((focus) => {
    let title;
    if (focus.slug in locales.focuses) {
      type LocaleKey = keyof typeof locales.focuses;
      title = locales.focuses[focus.slug as LocaleKey].title;
    } else {
      console.error(`Focus ${focus.slug} not found in locales`);
      title = focus.slug;
    }
    return {
      label: title,
      value: focus.id,
    };
  });

  const selectedFocuses =
    organization.focuses && focuses
      ? focuses
          .filter((focus) => organization.focuses.includes(focus.id))
          .sort((currentFocus, nextFocus) => {
            let currentTitle;
            let nextTitle;
            if (currentFocus.slug in locales.focuses) {
              type LocaleKey = keyof typeof locales.focuses;
              currentTitle =
                locales.focuses[currentFocus.slug as LocaleKey].title;
            } else {
              console.error(`Focus ${currentFocus.slug} not found in locales`);
              currentTitle = currentFocus.slug;
            }
            if (nextFocus.slug in locales.focuses) {
              type LocaleKey = keyof typeof locales.focuses;
              nextTitle = locales.focuses[nextFocus.slug as LocaleKey].title;
            } else {
              console.error(`Focus ${nextFocus.slug} not found in locales`);
              nextTitle = nextFocus.slug;
            }
            return currentTitle.localeCompare(nextTitle);
          })
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
          method="post"
          onSubmit={(e: React.SyntheticEvent) => {
            reset({}, { keepValues: true });
          }}
        >
          <h1 className="mb-8">{locales.route.content.headline}</h1>

          <h4 className="mb-4 font-semibold">
            {locales.route.content.general.headline}
          </h4>

          <p className="mb-8">{locales.route.content.general.intro}</p>
          <div className="mb-6">
            <InputText
              {...register("name")}
              id="name"
              label={locales.route.form.name.label}
              withPublicPrivateToggle={false}
              isPublic={organizationVisibilities.name}
              defaultValue={organization.name}
              errorMessage={errors?.name?.message}
            />
          </div>
          <div className="flex flex-col @md:mv-flex-row -mx-4 mb-2">
            <div className="basis-full @md:mv-basis-6/12 px-4 mb-6">
              <InputText
                {...register("email")}
                id="email"
                label={locales.route.form.email.label}
                errorMessage={errors?.email?.message}
                withPublicPrivateToggle={true}
                isPublic={organizationVisibilities.email}
              />
            </div>
            <div className="basis-full @md:mv-basis-6/12 px-4 mb-6">
              <InputText
                {...register("phone")}
                id="phone"
                label={locales.route.form.phone.label}
                errorMessage={errors?.phone?.message}
                withPublicPrivateToggle={true}
                isPublic={organizationVisibilities.phone}
              />
            </div>
          </div>
          <h4 className="mb-4 font-semibold">
            {locales.route.content.address.headline}
          </h4>
          <div className="flex flex-col @md:mv-flex-row -mx-4">
            <div className="basis-full @md:mv-basis-6/12 px-4 mb-6">
              <InputText
                {...register("street")}
                id="street"
                label={locales.route.form.street.label}
                errorMessage={errors?.street?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.street}
              />
            </div>
            <div className="basis-full @md:mv-basis-6/12 px-4 mb-6">
              <InputText
                {...register("streetNumber")}
                id="streetNumber"
                label={locales.route.form.streetNumber.label}
                errorMessage={errors?.streetNumber?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.streetNumber}
              />
            </div>
          </div>
          <div className="flex flex-col @md:mv-flex-row -mx-4 mb-2">
            <div className="basis-full @md:mv-basis-6/12 px-4 mb-6">
              <InputText
                {...register("zipCode")}
                id="zipCode"
                label={locales.route.form.zipCode.label}
                errorMessage={errors?.zipCode?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.zipCode}
              />
            </div>
            <div className="basis-full @md:mv-basis-6/12 px-4 mb-6">
              <InputText
                {...register("city")}
                id="city"
                label={locales.route.form.city.label}
                errorMessage={errors?.city?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.city}
              />
            </div>
          </div>

          <hr className="border-neutral-400 my-10 @lg:mv-my-16" />

          <h4 className="font-semibold mb-4">
            {locales.route.content.about.headline}
          </h4>

          <p className="mb-8">{locales.route.content.about.intro}</p>

          <div className="mb-4">
            <TextAreaWithCounter
              {...register("bio")}
              id="bio"
              defaultValue={organization.bio || ""}
              label={locales.route.form.bio.label}
              withPublicPrivateToggle={true}
              isPublic={organizationVisibilities.bio}
              errorMessage={errors?.bio?.message}
              maxCharacters={500}
              rte
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="types"
              label={locales.route.form.organizationForm.label}
              entries={selectedOrganizationTypes.map((type) => {
                let title;
                if (type.slug in locales.organizationTypes) {
                  type LocaleKey = keyof typeof locales.organizationTypes;
                  title =
                    locales.organizationTypes[type.slug as LocaleKey].title;
                } else {
                  console.error(
                    `Organization type ${type.slug} not found in locales`
                  );
                  title = type.slug;
                }
                return {
                  label: title,
                  value: type.id,
                };
              })}
              options={organizationTypesOptions.filter((option) => {
                return !organization.types.includes(option.value);
              })}
              placeholder={locales.route.form.organizationForm.placeholder}
              withPublicPrivateToggle={false}
              isPublic={organizationVisibilities.types}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="areas"
              label={locales.route.form.areas.label}
              placeholder={locales.route.form.areas.placeholder}
              entries={selectedAreas.map((area) => ({
                label: area.name,
                value: area.id,
              }))}
              options={areaOptions}
              withPublicPrivateToggle={false}
              isPublic={organizationVisibilities.areas}
            />
          </div>
          <div className="mb-4">
            <InputAdd
              name="supportedBy"
              label={locales.route.form.supportedBy.label}
              entries={organization.supportedBy ?? []}
              withPublicPrivateToggle={false}
              isPublic={organizationVisibilities.supportedBy}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="focuses"
              label={locales.route.form.focuses.label}
              placeholder={locales.route.form.focuses.placeholder}
              entries={selectedFocuses.map((focus) => {
                let title;
                if (focus.slug in locales.focuses) {
                  type LocaleKey = keyof typeof locales.focuses;
                  title = locales.focuses[focus.slug as LocaleKey].title;
                } else {
                  console.error(`Focus ${focus.slug} not found in locales`);
                  title = focus.slug;
                }
                return {
                  label: title,
                  value: focus.id,
                };
              })}
              options={focusOptions.filter((option) => {
                return !organization.focuses.includes(option.value);
              })}
              withPublicPrivateToggle={true}
              isPublic={organizationVisibilities.focuses}
            />
          </div>
          <div className="mb-4">
            <TextAreaWithCounter
              {...register("quote")}
              id="quote"
              label={locales.route.form.quote.label}
              withPublicPrivateToggle={true}
              isPublic={organizationVisibilities.quote}
              errorMessage={errors?.quote?.message}
              maxCharacters={300}
            />
          </div>
          <div className="flex flex-col @md:mv-flex-row -mx-4 mb-2 w-full">
            <div className="basis-full @md:mv-basis-6/12 px-4 mb-6">
              <InputText
                {...register("quoteAuthor")}
                id="quoteAuthor"
                label={locales.route.form.quoteAuthor.label}
                errorMessage={errors?.quoteAuthor?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.quoteAuthor}
              />
            </div>
            <div className="basis-full @md:mv-basis-6/12 px-4 mb-6">
              <InputText
                {...register("quoteAuthorInformation")}
                id="quoteAuthorInformation"
                label={locales.route.form.quoteAuthorInformation.label}
                errorMessage={errors?.quoteAuthorInformation?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.quoteAuthorInformation}
              />
            </div>
          </div>

          <hr className="border-neutral-400 my-10 @lg:mv-my-16" />

          <h2 className="mb-8">
            {locales.route.content.websiteAndSocial.headline}
          </h2>

          <h4 className="mb-4 font-semibold">
            {locales.route.content.websiteAndSocial.website.headline}
          </h4>

          <p className="mb-8">
            {locales.route.content.websiteAndSocial.website.intro}
          </p>

          <div className="basis-full mb-4">
            <InputText
              {...register("website")}
              id="website"
              label={locales.route.form.website.label}
              placeholder={locales.route.form.website.placeholder}
              withPublicPrivateToggle={true}
              isPublic={organizationVisibilities.website}
              errorMessage={errors?.website?.message}
              withClearButton
            />
          </div>

          <hr className="border-neutral-400 my-10 @lg:mv-my-16" />

          <h4 className="mb-4 font-semibold">
            {locales.route.content.websiteAndSocial.social.headline}
          </h4>

          <p className="mb-8">
            {locales.route.content.websiteAndSocial.social.intro}
          </p>

          {createSocialMediaServices(locales).map((service) => (
            <div className="w-full mb-4" key={service.id}>
              <InputText
                {...register(service.id)}
                id={service.id}
                label={service.label}
                placeholder={service.organizationPlaceholder}
                withPublicPrivateToggle={true}
                isPublic={organizationVisibilities[service.id]}
                errorMessage={errors?.[service.id]?.message}
                withClearButton
              />
            </div>
          ))}

          <footer className="fixed z-10 bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
            <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
              <div className="flex flex-row flex-nowrap items-center justify-end my-4">
                <div
                  className={`text-green-500 text-bold ${
                    actionData?.updated && !isSubmitting
                      ? "block animate-fade-out"
                      : "hidden"
                  }`}
                >
                  {locales.route.content.feedback}
                </div>

                {isFormChanged ? (
                  <Link
                    to={`/organization/${slug}/settings`}
                    reloadDocument
                    className={`btn btn-link`}
                  >
                    {locales.route.form.reset.label}
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
                  {locales.route.form.submit.label}
                </button>
              </div>
            </div>
          </footer>
        </Form>
      </FormProvider>
    </>
  );
}

export default Index;
