import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useParams,
  useNavigation,
} from "@remix-run/react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
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
import { socialMediaServices } from "~/lib/utils/socialMediaServices";
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

const organizationSchema = object({
  name: string().required("Bitte gib Euren Namen ein."),
  email: nullOrString(
    string().email("Deine Eingabe entspricht nicht dem Format einer E-Mail.")
  ),
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

type OrganizationSchemaType = typeof organizationSchema;
type OrganizationFormType = InferType<typeof organizationSchema>;

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
  const { authClient, response } = createAuthClient(request);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  const dbOrganization = await getWholeOrganizationBySlug(slug);
  if (dbOrganization === null) {
    throw json(
      {
        message: `Organization with slug "${slug}" not found.`,
      },
      { status: 404 }
    );
  }
  const organizationVisibilities = await getOrganizationVisibilitiesById(
    dbOrganization.id
  );
  if (organizationVisibilities === null) {
    throw json(
      { message: "organization visbilities not found." },
      { status: 404 }
    );
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

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const { authClient, response } = createAuthClient(request);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  const organization = await getOrganizationBySlug(slug);
  invariantResponse(organization, "Organization not found", { status: 404 });

  const parsedFormData = await getFormValues<OrganizationSchemaType>(
    request,
    organizationSchema
  );

  let errors: FormError | null;
  let data: OrganizationFormType;

  try {
    const result = await validateForm<OrganizationSchemaType>(
      organizationSchema,
      parsedFormData
    );
    errors = result.errors;
    data = result.data;
  } catch (error) {
    console.error(error);
    throw json({ message: "Validation failed" }, { status: 400 });
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
          // TODO: fix type issue
          // @ts-ignore
          organizationData,
          privateFields
        );
        updated = true;
      } catch (error) {
        console.error(error);
        throw json(
          { message: "Something went wrong on update." },
          { status: 500 }
        );
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
          <h1 className="mb-8">Deine Organisation</h1>

          <h4 className="mb-4 font-semibold">Allgemein</h4>

          <p className="mb-8">Wie kann die Community Euch erreichen?</p>
          <div className="mb-6">
            <InputText
              {...register("name")}
              id="name"
              label="Name"
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
                label="E-Mail"
                errorMessage={errors?.email?.message}
                withPublicPrivateToggle={true}
                isPublic={organizationVisibilities.email}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("phone")}
                id="phone"
                label="Telefon"
                errorMessage={errors?.phone?.message}
                withPublicPrivateToggle={true}
                isPublic={organizationVisibilities.phone}
              />
            </div>
          </div>
          <h4 className="mb-4 font-semibold">Anschrift</h4>
          <div className="flex flex-col md:flex-row -mx-4">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("street")}
                id="street"
                label="Straßenname"
                errorMessage={errors?.street?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.street}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("streetNumber")}
                id="streetNumber"
                label="Hausnummer"
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
                label="PLZ"
                errorMessage={errors?.zipCode?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.zipCode}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("city")}
                id="city"
                label="Stadt"
                errorMessage={errors?.city?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.city}
              />
            </div>
          </div>

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h4 className="font-semibold mb-4">Über uns</h4>

          <p className="mb-8">
            Teile der Community mehr über Deine Organisation mit.
          </p>

          <div className="mb-4">
            <TextAreaWithCounter
              {...register("bio")}
              id="bio"
              defaultValue={organization.bio || ""}
              label="Kurzbeschreibung"
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
              label="Organisationsform"
              entries={selectedOrganizationTypes.map((type) => ({
                label: type.title,
                value: type.id,
              }))}
              options={organizationTypesOptions.filter((option) => {
                return !organization.types.includes(option.value);
              })}
              placeholder="Füge Eure Organisationsformen hinzu."
              withPublicPrivateToggle={false}
              isPublic={organizationVisibilities.types}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="areas"
              label={"Aktivitätsgebiete"}
              placeholder="Füge Eure Aktivitätsgebiete hinzu."
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
              label="Gefördert von"
              entries={organization.supportedBy ?? []}
              withPublicPrivateToggle={false}
              isPublic={organizationVisibilities.supportedBy}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="focuses"
              label={"MINT-Schwerpunkte"}
              placeholder="Füge Eure MINT-Schwerpunkte hinzu."
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
              label="Zitat"
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
                label="Von wem stammt das Zitat?"
                errorMessage={errors?.quoteAuthor?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.quoteAuthor}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("quoteAuthorInformation")}
                id="quoteAuthorInformation"
                label="Zusatzinformationen des Zitatautors (Position/Beruf)"
                errorMessage={errors?.quoteAuthorInformation?.message}
                withPublicPrivateToggle={false}
                isPublic={organizationVisibilities.quoteAuthorInformation}
              />
            </div>
          </div>

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h2 className="mb-8">Website und Soziale Netzwerke</h2>

          <h4 className="mb-4 font-semibold">Website</h4>

          <p className="mb-8">
            Wo kann die Community mehr über Euer Angebot erfahren?
          </p>

          <div className="basis-full mb-4">
            <InputText
              {...register("website")}
              id="website"
              label="Website"
              placeholder="domainname.tld"
              withPublicPrivateToggle={true}
              isPublic={organizationVisibilities.website}
              errorMessage={errors?.website?.message}
              withClearButton
            />
          </div>

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h4 className="mb-4 font-semibold">Soziale Netzwerke</h4>

          <p className="mb-8">
            In welchen Netzwerken ist Deine Organisation vertreten?
          </p>

          {socialMediaServices.map((service) => (
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
                  Informationen wurden aktualisiert.
                </div>

                {isFormChanged ? (
                  <Link
                    to={`/organization/${slug}/settings`}
                    reloadDocument
                    className={`btn btn-link`}
                  >
                    Änderungen verwerfen
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
                  Speichern
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
