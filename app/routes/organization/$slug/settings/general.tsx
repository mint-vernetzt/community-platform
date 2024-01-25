import type { ActionArgs, LinksFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useParams,
  useTransition,
} from "@remix-run/react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { badRequest, notFound, serverError } from "remix-utils";
import type { InferType } from "yup";
import { array, object, string } from "yup";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
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

import quillStyles from "react-quill/dist/quill.snow.css";
import { invariantResponse } from "~/lib/utils/response";
import { getOrganizationBySlug } from "./general.server";
import i18next from "~/i18next.server";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";

const i18nNS = ["routes/organization/settings/general"];
export const handle = {
  i18n: i18nNS,
};

const createOrganizationSchema = (t: TFunction) => {
  return object({
    name: string().required(t("validation.name.required")),
    email: nullOrString(string().email(t("validation.email.email"))),
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

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/organization/settings/general",
  ]);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  const dbOrganization = await getWholeOrganizationBySlug(slug);
  if (dbOrganization === null) {
    throw notFound({
      message: t("error.notFound.named", { slug: slug }),
    });
  }
  const organizationVisibilities = await getOrganizationVisibilitiesById(
    dbOrganization.id
  );
  if (organizationVisibilities === null) {
    throw notFound({ message: t("error.notFound.visibilities") });
  }

  const organization = makeFormOrganizationFromDbOrganization(dbOrganization);

  const organizationTypes = await getOrganizationTypes();
  const focuses = await getFocuses();
  const areas = await getAreas();

  return json(
    {
      organization,
      organizationVisibilities,
      organizationTypes,
      areas,
      focuses,
    },
    { headers: response.headers }
  );
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: quillStyles },
];

export const action = async (args: ActionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/organization/settings/general",
  ]);
  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  const organization = await getOrganizationBySlug(slug);
  invariantResponse(
    organization,
    t('error.notFound.organization"organization visbilities not found."'),
    { status: 404 }
  );

  let parsedFormData = await getFormValues<OrganizationSchemaType>(
    request,
    createOrganizationSchema(t)
  );

  let errors: FormError | null;
  let data: OrganizationFormType;

  try {
    let result = await validateForm<OrganizationSchemaType>(
      createOrganizationSchema(t),
      parsedFormData
    );
    errors = result.errors;
    data = result.data;
  } catch (error) {
    console.error(error);
    throw badRequest({ message: t("error.validation") });
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
        throw serverError({ message: t("error.serverError") });
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

  return json(
    {
      organization: data,
      lastSubmit: (formData.get("submit") as string) ?? "",
      updated,
      errors,
    },
    { headers: response.headers }
  );
};

function Index() {
  const { slug } = useParams();
  const {
    organization: dbOrganization,
    organizationVisibilities,
    organizationTypes,
    areas,
    focuses,
  } = useLoaderData<typeof loader>();

  const transition = useTransition();
  const actionData = useActionData<typeof action>();

  const formRef = React.createRef<HTMLFormElement>();
  const isSubmitting = transition.state === "submitting";

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
    return {
      label: type.title,
      value: type.id,
    };
  });

  const selectedOrganizationTypes =
    organization.types && organizationTypes
      ? organizationTypes
          .filter((type) => organization.types.includes(type.id))
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  const selectedAreas =
    organization.areas && areas
      ? areas
          .filter((area) => organization.areas.includes(area.id))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

  const areaOptions = createAreaOptionFromData(areas);

  const focusOptions = focuses.map((focus) => {
    return {
      label: focus.title,
      value: focus.id,
    };
  });

  const selectedFocuses =
    organization.focuses && focuses
      ? focuses
          .filter((focus) => organization.focuses.includes(focus.id))
          .sort((a, b) => a.title.localeCompare(b.title))
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
  const { t } = useTranslation(i18nNS);

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
          <h1 className="mb-8">{t("content.headline")}</h1>

          <h4 className="mb-4 font-semibold">
            {t("content.general.headline")}
          </h4>

          <p className="mb-8">{t("content.general.intro")}</p>
          <div className="mb-6">
            <InputText
              {...register("name")}
              id="name"
              label={t("form.name.label")}
              withPublicPrivateToggle={false}
              isPublic={organizationVisibilities.name}
              defaultValue={organization.name}
              errorMessage={errors?.name?.message}
            />
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("email")}
                id="email"
                label={t("form.email.label")}
                errorMessage={errors?.email?.message}
                withPublicPrivateToggle={true}
                isPublic={organizationVisibilities.email}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("phone")}
                id="phone"
                label={t("form.phone.label")}
                errorMessage={errors?.phone?.message}
                withPublicPrivateToggle={true}
                isPublic={organizationVisibilities.phone}
              />
            </div>
          </div>
          <h4 className="mb-4 font-semibold">
            {t("content.address.headline")}
          </h4>
          <div className="flex flex-col md:flex-row -mx-4">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("street")}
                id="street"
                label={t("form.street.label")}
                errorMessage={errors?.street?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.street}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("streetNumber")}
                id="streetNumber"
                label={t("form.streetNumber.label")}
                errorMessage={errors?.streetNumber?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.streetNumber}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("zipCode")}
                id="zipCode"
                label={t("form.zipCode.label")}
                errorMessage={errors?.zipCode?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.zipCode}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("city")}
                id="city"
                label={t("form.city.label")}
                errorMessage={errors?.city?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.city}
              />
            </div>
          </div>

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h4 className="font-semibold mb-4">{t("content.about.headline")}</h4>

          <p className="mb-8">{t("content.about.intro")}</p>

          <div className="mb-4">
            <TextAreaWithCounter
              {...register("bio")}
              id="bio"
              defaultValue={organization.bio || ""}
              label={t("form.bio.label")}
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
              label={t("form.organizationForm.label")}
              entries={selectedOrganizationTypes.map((type) => ({
                label: type.title,
                value: type.id,
              }))}
              options={organizationTypesOptions.filter((option) => {
                return !organization.types.includes(option.value);
              })}
              placeholder={t("form.organizationForm.placeholder")}
              withPublicPrivateToggle={false}
              isPublic={organizationVisibilities.types}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="areas"
              label={t("form.areas.label")}
              placeholder={t("form.areas.placeholder")}
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
              label={t("form.supportedBy.label")}
              entries={organization.supportedBy ?? []}
              withPublicPrivateToggle={false}
              isPublic={organizationVisibilities.supportedBy}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="focuses"
              label={t("form.focuses.label")}
              placeholder={t("form.focuses.placeholder")}
              entries={selectedFocuses.map((focus) => ({
                label: focus.title,
                value: focus.id,
              }))}
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
              label={t("form.quote.label")}
              withPublicPrivateToggle={true}
              isPublic={organizationVisibilities.quote}
              errorMessage={errors?.quote?.message}
              maxCharacters={300}
            />
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2 w-full">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("quoteAuthor")}
                id="quoteAuthor"
                label={t("form.quoteAuthor.label")}
                errorMessage={errors?.quoteAuthor?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.quoteAuthor}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("quoteAuthorInformation")}
                id="quoteAuthorInformation"
                label={t("form.quoteAuthorInformation.label")}
                errorMessage={errors?.quoteAuthorInformation?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.quoteAuthorInformation}
              />
            </div>
          </div>

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h2 className="mb-8">{t("content.websiteAndSocial.headline")}</h2>

          <h4 className="mb-4 font-semibold">
            {t("content.websiteAndSocial.website.headline")}
          </h4>

          <p className="mb-8">{t("content.websiteAndSocial.website.intro")}</p>

          <div className="basis-full mb-4">
            <InputText
              {...register("website")}
              id="website"
              label={t("form.website.label")}
              placeholder={t("form.website.placeholder")}
              withPublicPrivateToggle={true}
              isPublic={organizationVisibilities.website}
              errorMessage={errors?.website?.message}
              withClearButton
            />
          </div>

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h4 className="mb-4 font-semibold">
            {t("content.websiteAndSocial.social.headline")}
          </h4>

          <p className="mb-8">{t("content.websiteAndSocial.social.intro")}</p>

          {createSocialMediaServices(t).map((service) => (
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

          <footer className="fixed z-10 bg-white border-t-2 border-primary w-full inset-x-0 bottom-0 pb-24 md:pb-0">
            <div className="container">
              <div className="flex flex-row flex-nowrap items-center justify-end my-4">
                <div
                  className={`text-green-500 text-bold ${
                    actionData?.updated && !isSubmitting
                      ? "block animate-fade-out"
                      : "hidden"
                  }`}
                >
                  {t("content.feedback")}
                </div>

                {isFormChanged ? (
                  <Link
                    to={`/organization/${slug}/settings`}
                    reloadDocument
                    className={`btn btn-link`}
                  >
                    {t("form.reset.label")}
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
                  {t("form.submit.label")}
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
