import { Area, Focus, OrganizationType } from "@prisma/client";
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
import { badRequest, forbidden, serverError } from "remix-utils";
import { array, InferType, object, string } from "yup";
import { getUserByRequest } from "~/auth.server";
import InputAdd from "~/components/FormElements/InputAdd/InputAdd";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import { createAreaOptionFromData } from "~/lib/profile/createAreaOptionFromData";
import { socialMediaServices } from "~/lib/profile/socialMediaServices";
import { objectListOperationResolver } from "~/lib/utils/components";
import {
  FormError,
  getFormValues,
  multiline,
  phone,
  social,
  validateForm,
  website,
} from "~/lib/utils/yup";
import { prismaClient } from "~/prisma";

const organizationSchema = object({
  name: string().required(),
  email: string().email(),
  phone: phone(),
  street: string(),
  streetNumber: string(),
  zipCode: string(),
  city: string(),
  website: website(),
  facebook: social("facebook"),
  linkedin: social("linkedin"),
  twitter: social("twitter"),
  xing: social("xing"),
  bio: multiline(),
  types: array(string().required()).required(),
  quote: multiline(),
  quoteAuthor: string(),
  quoteAuthorInformation: string(),
  supportedBy: array(string().required()).required(),
  publicFields: array(string().required()).required(),
  areas: array(string().required()).required(),
  focuses: array(string().required()).required(),
});

type OrganizationSchemaType = typeof organizationSchema;
type OrganizationFormType = InferType<typeof organizationSchema>;

type LoaderData = {
  organization: OrganizationFormType;
  organizationTypes: OrganizationType[];
  areas: Area[];
  focuses: Focus[];
};

export const loader: LoaderFunction = async (args) => {
  const getOrganization = async (slug: string, userId: string) => {
    const organization = await prismaClient.organization.findFirst({
      where: {
        slug,
        teamMembers: {
          some: {
            profileId: userId,
            isPrivileged: true,
          },
        },
      },
      include: {
        types: {
          select: {
            organizationTypeId: true,
          },
        },
        areas: {
          select: {
            areaId: true,
          },
        },
        focuses: {
          select: {
            focusId: true,
          },
        },
      },
    });
    return organization;
  };

  // TODO: find better place
  const getOrganizationTypes = async () => {
    const organizationTypes = await prismaClient.organizationType.findMany();
    return organizationTypes;
  };

  // TODO: find better place
  const getFocuses = async () => {
    const focuses = await prismaClient.focus.findMany();
    return focuses;
  };

  // TODO: find better place
  const getAreas = async () => {
    return await prismaClient.area.findMany({
      include: {
        state: true,
      },
    });
  };

  const { params, request } = args;
  const slug = params.slug;

  if (slug === undefined) {
    throw badRequest({ message: "$slug must be provided." });
  }

  const currentUser = await getUserByRequest(request.clone());
  if (currentUser == null) {
    throw forbidden({ message: "Not logged in." });
  }

  const organization = await getOrganization(slug, currentUser.id);

  if (organization === null) {
    throw forbidden({
      message: `Organization with slug "${slug}" not found or not permitted to edit.`,
    });
  }

  const organizationTypes = await getOrganizationTypes();
  const focuses = await getFocuses();

  const areas = await getAreas();

  return {
    organization: {
      ...organization,
      types: organization.types.map((type) => {
        return type.organizationTypeId;
      }),
      areas: organization.areas.map((area) => {
        return area.areaId;
      }),
      focuses: organization.focuses.map((focus) => {
        return focus.focusId;
      }),
    },
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
  const getOrganization = async (slug: string, userId: string) => {
    const organization = await prismaClient.organization.findFirst({
      where: {
        slug,
        teamMembers: {
          some: {
            profileId: userId,
            isPrivileged: true,
          },
        },
      },
    });
    return organization;
  };

  const { params, request } = args;

  const slug = params.slug;

  if (slug === undefined) {
    throw badRequest({ message: "$slug must be provided." });
  }

  const currentUser = await getUserByRequest(request.clone());
  if (currentUser == null) {
    throw forbidden({ message: "Not logged in." });
  }

  const organization = await getOrganization(slug, currentUser.id);

  if (organization === null) {
    throw forbidden({
      message: `Organization with slug "${slug}" not found or not permitted to edit.`,
    });
  }

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
        await prismaClient.organization.update({
          where: {
            slug,
          },
          data: {
            ...data,
            types: {
              deleteMany: {},
              connectOrCreate: data.types.map((typeId) => {
                return {
                  where: {
                    organizationId_organizationTypeId: {
                      organizationTypeId: typeId,
                      organizationId: organization.id,
                    },
                  },
                  create: {
                    organizationTypeId: typeId,
                  },
                };
              }),
            },
            focuses: {
              deleteMany: {},
              connectOrCreate: data.focuses.map((focusId) => {
                return {
                  where: {
                    organizationId_focusId: {
                      focusId,
                      organizationId: organization.id,
                    },
                  },
                  create: {
                    focusId,
                  },
                };
              }),
            },
            areas: {
              deleteMany: {},
              connectOrCreate: data.areas.map((areaId) => {
                return {
                  where: {
                    organizationId_areaId: {
                      areaId,
                      organizationId: organization.id,
                    },
                  },
                  create: {
                    areaId,
                  },
                };
              }),
            },
          },
        });

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
    if (
      actionData?.lastSubmit === "submit" &&
      actionData?.errors !== undefined &&
      actionData?.errors !== null
    ) {
      const errorElement = document.getElementsByName(
        Object.keys(actionData.errors)[0]
      );
      const yPosition =
        errorElement[0].getBoundingClientRect().top - window.innerHeight / 2;
      window.scrollTo(0, yPosition);

      errorElement[0].focus({ preventScroll: true });
    }
  }, [isSubmitting, formRef, actionData]);

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
          <h1 className="mb-8">Institutionelle Daten</h1>

          <h4 className="mb-4 font-semibold">Allgemein</h4>

          <p className="mb-8">
            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
            nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
            erat, sed diam voluptua.
          </p>
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
                defaultValue={organization.email}
                errorMessage={errors?.email?.message}
                isPublic={organization.publicFields?.includes("email")}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("phone")}
                id="phone"
                label="Telefon"
                defaultValue={organization.phone}
                errorMessage={errors?.phone?.message}
                isPublic={organization.publicFields?.includes("phone")}
              />
            </div>
          </div>
          <h4 className="mb-4 font-semibold">Ich Anschrift Hauptsitz</h4>
          <div className="flex flex-col md:flex-row -mx-4">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("street")}
                id="street"
                label="Straßenname"
                defaultValue={organization.street}
                errorMessage={errors?.street?.message}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("streetNumber")}
                id="streetNumber"
                label="Hausnummer"
                defaultValue={organization.streetNumber}
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
                defaultValue={organization.zipCode}
                errorMessage={errors?.zipCode?.message}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("city")}
                id="city"
                label="Stadt"
                defaultValue={organization.city}
                errorMessage={errors?.city?.message}
              />
            </div>
          </div>

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
            placeholder=""
          />

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h4 className="font-semibold mb-4">Über uns</h4>

          <p className="mb-8">
            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
            nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
            erat, sed diam voluptua.
          </p>

          <div className="mb-4">
            <TextAreaWithCounter
              {...register("bio")}
              id="bio"
              label="Kurzbeschreibung"
              isPublic={organization.publicFields?.includes("bio")}
              defaultValue={organization.bio}
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
              name="supportedBy"
              label="Gefördert von"
              entries={organization.supportedBy ?? []}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="focuses"
              label={"MINT-Schwerpunkte"}
              placeholder="MINT-Schwerpunkt hinzufügen"
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
              defaultValue={organization.quote}
              errorMessage={errors?.quote?.message}
              maxCharacters={300}
            />
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2 w-full">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("quoteAuthor")}
                id="quoteAuthor"
                label="Von"
                defaultValue={organization.quoteAuthor}
                errorMessage={errors?.quoteAuthor?.message}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("quoteAuthorInformation")}
                id="quoteAuthorInformation"
                label="Zusatzinformationen (Position/Beruf)"
                defaultValue={organization.quoteAuthorInformation}
                errorMessage={errors?.quoteAuthorInformation?.message}
              />
            </div>
          </div>

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h2 className="mb-8">Website und Soziale Netzwerke</h2>

          <h4 className="mb-4 font-semibold">Website</h4>

          <p className="mb-8">
            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
            nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
            erat, sed diam voluptua.
          </p>

          <div className="basis-full mb-4">
            <InputText
              {...register("website")}
              id="website"
              label="Website URL"
              defaultValue={organization.website}
              placeholder="domainname.tld"
              isPublic={organization.publicFields?.includes("website")}
              errorMessage={errors?.website?.message}
              withClearButton
            />
          </div>

          <hr className="border-neutral-400 my-10 lg:my-16" />

          <h4 className="mb-4 font-semibold">Soziale Netzwerke</h4>

          <p className="mb-8">
            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
            nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
            erat, sed diam voluptua.
          </p>

          {socialMediaServices.map((service) => (
            <div className="w-full mb-4">
              <InputText
                key={service.id}
                {...register(service.id)}
                id={service.id}
                label={service.label}
                defaultValue={organization[service.id] as string}
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
                  Profil wurde aktualisiert.
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
