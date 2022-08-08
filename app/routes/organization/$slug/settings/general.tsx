import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  useActionData,
  useLoaderData,
  useParams,
  useTransition,
} from "remix";
import { forbidden, notFound, serverError } from "remix-utils";
import { array, InferType, object, string } from "yup";
import InputAdd from "~/components/FormElements/InputAdd/InputAdd";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import { createAreaOptionFromData } from "~/lib/profile/createAreaOptionFromData";
import { objectListOperationResolver } from "~/lib/utils/components";
import { socialMediaServices } from "~/lib/utils/socialMediaServices";
import {
  FormError,
  getFormValues,
  multiline,
  nullOrString,
  phone,
  social,
  validateForm,
  website,
} from "~/lib/utils/yup";
import {
  getAreas,
  getFocuses,
  getOrganizationTypes,
  getWholeOrganizationBySlug,
  handleAuthorization,
  updateOrganizationById,
} from "./utils.server";

const organizationSchema = object({
  name: string().required("Bitte gib Euren Namen ein."),
  email: nullOrString(string().email()),
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
  publicFields: array(string().required()).required(),
  areas: array(string().required()).required(),
  focuses: array(string().required()).required(),
});

type OrganizationSchemaType = typeof organizationSchema;
type OrganizationFormType = InferType<typeof organizationSchema>;

type LoaderData = {
  organization: ReturnType<typeof makeFormOrganizationFromDbOrganization>;
  organizationTypes: Awaited<ReturnType<typeof getOrganizationTypes>>;
  areas: Awaited<ReturnType<typeof getAreas>>;
  focuses: Awaited<ReturnType<typeof getFocuses>>;
};

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

export const loader: LoaderFunction = async (args) => {
  const { slug } = await handleAuthorization(args);

  const dbOrganization = await getWholeOrganizationBySlug(slug);
  if (dbOrganization === null) {
    throw notFound({
      message: `Organization with slug "${slug}" not found or not permitted to edit.`,
    });
  }

  const organization = makeFormOrganizationFromDbOrganization(dbOrganization);

  const organizationTypes = await getOrganizationTypes();
  const focuses = await getFocuses();
  const areas = await getAreas();

  return {
    organization,
    organizationTypes,
    areas,
    focuses,
  };
};

type ActionData = {
  organization: OrganizationFormType;
  lastSubmit: string;
  errors: FormError | null;
  updated: boolean;
};

export const action: ActionFunction = async (args) => {
  const { organization } = await handleAuthorization(args);
  const { request } = args;

  let parsedFormData = await getFormValues<OrganizationSchemaType>(
    request,
    organizationSchema
  );

  let { errors, data } = await validateForm<OrganizationSchemaType>(
    organizationSchema,
    parsedFormData
  );

  let updated = false;

  const formData = await request.clone().formData();
  const submit = formData.get("submit");
  if (submit === "submit") {
    if (errors === null) {
      try {
        await updateOrganizationById(organization.id, data);
        updated = true;
      } catch (error) {
        console.error(error);
        throw serverError({ message: "Something went wrong on update." });
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
    organizationTypes,
    areas,
    focuses,
  } = useLoaderData<LoaderData>();

  const transition = useTransition();
  const actionData = useActionData<ActionData>();

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
                isPublic={organization.publicFields?.includes("email")}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("phone")}
                id="phone"
                label="Telefon"
                errorMessage={errors?.phone?.message}
                isPublic={organization.publicFields?.includes("phone")}
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
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("streetNumber")}
                id="streetNumber"
                label="Hausnummer"
                errorMessage={errors?.streetNumber?.message}
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
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("city")}
                id="city"
                label="Stadt"
                errorMessage={errors?.city?.message}
              />
            </div>
          </div>

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h4 className="font-semibold mb-4">Über uns</h4>

          <p className="mb-8">
            Teile der Community mehr über Deine Organisation oder Dein Projekt
            mit.
          </p>

          <div className="mb-4">
            <TextAreaWithCounter
              {...register("bio")}
              id="bio"
              label="Kurzbeschreibung"
              isPublic={organization.publicFields?.includes("bio")}
              errorMessage={errors?.bio?.message}
              maxCharacters={500}
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
            />
          </div>
          <div className="mb-4">
            <InputAdd
              name="supportedBy"
              label="Gefördert von"
              entries={organization.supportedBy ?? []}
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
              isPublic={organization.publicFields?.includes("focuses")}
            />
          </div>
          <div className="mb-4">
            <TextAreaWithCounter
              {...register("quote")}
              id="quote"
              label="Zitat"
              isPublic={organization.publicFields?.includes("quote")}
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
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("quoteAuthorInformation")}
                id="quoteAuthorInformation"
                label="Zusatzinformationen des Zitatauthors (Position/Beruf)"
                errorMessage={errors?.quoteAuthorInformation?.message}
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
              isPublic={organization.publicFields?.includes("website")}
              errorMessage={errors?.website?.message}
              withClearButton
            />
          </div>

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h4 className="mb-4 font-semibold">Soziale Netzwerke</h4>

          <p className="mb-8">
            In welchen Netzwerken ist Deine Organisation oder Dein Projekt
            vertreten?
          </p>

          {socialMediaServices.map((service) => (
            <div className="w-full mb-4" key={service.id}>
              <InputText
                {...register(service.id)}
                id={service.id}
                label={service.label}
                placeholder={service.organizationPlaceholder}
                isPublic={organization.publicFields?.includes(service.id)}
                errorMessage={errors?.[service.id]?.message}
                withClearButton
              />
            </div>
          ))}

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
                  Deine Informationen wurden aktualisiert.
                </div>

                {isFormChanged && (
                  <Link
                    to={`/organization/${slug}/settings`}
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
        </Form>
      </FormProvider>
    </>
  );
}

export default Index;
