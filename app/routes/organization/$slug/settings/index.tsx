import { Area, OrganizationType, Profile } from "@prisma/client";
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
import { array, InferType, object, string, ValidationError } from "yup";
import { getUserByRequest } from "~/auth.server";
import InputAdd from "~/components/FormElements/InputAdd/InputAdd";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import { createAreaOptionFromData } from "~/lib/profile/createAreaOptionFromData";
import { socialMediaServices } from "~/lib/profile/socialMediaServices";
import { removeMoreThan2ConescutiveLinbreaks } from "~/lib/string/removeMoreThan2ConescutiveLinbreaks";
import { capitalizeFirstLetter } from "~/lib/string/transform";
import { prismaClient } from "~/prisma";
import { getAreas, getProfileByUserId } from "~/profile.server";

const organizationSchema = object({
  name: string().required(),
  email: string().email(),
  phone: string(),
  street: string(),
  streetNumber: string(),
  zipCode: string(),
  city: string(),
  website: string().matches(
    /((https?):\/\/)(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$|^$/,
    "Bitte geben Sie die Website URL im Format https://domainname.tld/ ein"
  ),
  facebook: string(),
  linkedin: string(),
  twitter: string(),
  xing: string(),
  bio: string(),
  types: array(string().required()).required(),
  quote: string(),
  quoteAuthor: string(),
  quoteAuthorInformation: string(),
  supportedBy: array(string()),
  publicFields: array(string()),
  areas: array(string().required()).required(),
});

type Error = {
  type: string;
  message: string;
};

type FormError = {
  [key: string]: {
    message: string;
    errors?: Error[];
  };
};

type OrganizationFormType = InferType<typeof organizationSchema>;

async function validateForm(form: OrganizationFormType) {
  let errors: FormError = {};

  try {
    await organizationSchema.validate(form, { abortEarly: false });
  } catch (validationError) {
    if (validationError instanceof ValidationError) {
      validationError.inner.forEach((validationError) => {
        if (validationError.path) {
          if (!errors[validationError.path]) {
            errors[validationError.path] = {
              message: validationError.message,
              errors: [],
            };
          } else {
            errors[
              validationError.path
            ].message += `, ${validationError.message}`;
          }

          errors[validationError.path].errors?.push({
            type: (validationError.type as string) ?? "",
            message: validationError.message,
          });
        }
      });
    }
  }

  return Object.keys(errors).length === 0 ? false : errors;
}

type LoaderData = {
  organization: Omit<OrganizationFormType, "types" | "areas"> & {
    types: string[];
    areas: string[];
  };
  organizationTypes: OrganizationType[];
  areas: Area[];
  profile: Profile;
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
      },
    });
    return organization;
  };

  const getOrganizationTypes = async () => {
    const organizationTypes = await prismaClient.organizationType.findMany();
    return organizationTypes;
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
  const profile = await getProfileByUserId(currentUser.id);

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
    },
    organizationTypes,
    areas,
    profile,
  };
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

  const createOrganizationDataToUpdate = async (request: Request) => {
    const formData = await request.clone().formData();

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      street: formData.get("street") as string,
      streetNumber: formData.get("streetNumber") as string,
      zipCode: formData.get("zipCode") as string,
      city: formData.get("city") as string,
      website: formData.get("website") as string,
      logo: formData.get("logo") as string,
      background: formData.get("background") as string,
      facebook: formData.get("facebook") as string,
      linkedin: formData.get("linkedin") as string,
      twitter: formData.get("twitter") as string,
      xing: formData.get("xing") as string,
      bio: formData.get("bio") as string,
      types: (formData.getAll("types") ?? []) as string[],
      quote: formData.get("quote") as string,
      quoteAuthor: formData.get("quoteAuthor") as string,
      quoteAuthorInformation: formData.get("quoteAuthorInformation") as string,
      supportedBy: (formData.getAll("supportedBy") ?? []) as string[],
      publicFields: (formData.getAll("publicFields") ?? []) as string[],
      // teamMembers: (formData.getAll("teamMembers") ?? []) as string[],
      // memberOf: (formData.getAll("memberOf") ?? []) as string[],
      // networkMembers: (formData.getAll("networkMembers") ?? []) as string[],
      areas: (formData.getAll("areas") ?? []) as string[],
    };

    return data;
  };

  const getListOperationName = (operation: string, name: string) => {
    const ucSingularName = capitalizeFirstLetter(name.slice(0, -1));
    return `${operation}${ucSingularName}`;
  };

  const addListEntry = (
    name: keyof OrganizationFormType,
    value: string,
    organization: OrganizationFormType
  ) => {
    return {
      ...organization,
      [name]: [...(organization[name] as string[]), value],
    };
  };

  const removeListEntry = (
    name: keyof OrganizationFormType,
    value: string,
    organization: OrganizationFormType
  ) => {
    return {
      ...organization,
      [name]: (organization[name] as string[]).filter(
        (v) => v !== value
      ) as string[],
    };
  };

  const organizationListOperationResolver = (
    organization: OrganizationFormType,
    name: keyof OrganizationFormType,
    formData: FormData
  ) => {
    const submit = formData.get("submit");
    const addOperation = getListOperationName("add", name);

    if (submit === addOperation && formData.get(addOperation) !== "") {
      return addListEntry(
        name,
        (formData.get(addOperation) as string) ?? "",
        organization
      );
    }

    const removeOperation = getListOperationName("remove", name);
    if (formData.get(removeOperation) !== "") {
      return removeListEntry(
        name,
        (formData.get(removeOperation) as string) ?? "",
        organization
      );
    }

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

  let data = await createOrganizationDataToUpdate(request);
  data["bio"] = removeMoreThan2ConescutiveLinbreaks(organization["bio"] ?? "");

  const errors = await validateForm(data);

  console.log(errors);

  let updated = false;

  const formData = await request.clone().formData();
  const submit = formData.get("submit");
  if (submit === "submit") {
    if (errors === false) {
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
      "supportedBy",
      // "memberOf",
      // "networkMembers",
      // "teamMembers",
      "areas",
    ];

    listData.forEach((name) => {
      // TODO: fix type issue
      // @ts-ignore
      data = organizationListOperationResolver(data, name, formData);
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
  } = useLoaderData<LoaderData>();

  const transition = useTransition();
  const actionData = useActionData();

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

  const errors = actionData?.errors as FormError;

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
          <button
            name="submit"
            type="submit"
            value="submit"
            className="hidden"
          />
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
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("phone")}
                id="phone"
                label="Telefon"
                defaultValue={organization.phone}
                errorMessage={errors?.phone?.message}
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
            label="Organizationstyp"
            entries={selectedOrganizationTypes.map((type) => ({
              label: type.title,
              value: type.id,
            }))}
            options={organizationTypesOptions.filter((option) => {
              return !organization.types.includes(option.value);
            })}
            placeholder=""
            isPublic={organization.publicFields?.includes("types")}
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
              maxCharacters={300}
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
              placeholder="https://www.domainname.tld/"
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
                placeholder={service.placeholder}
                defaultValue={organization[service.id] as string}
                isPublic={organization.publicFields?.includes(service.id)}
                errorMessage={errors?.[service.id]?.message}
                withClearButton
              />
            </div>
          ))}

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
            Die Organisation, das Netzwerk oder das Projekt, in dem Du tätig
            bist, hat noch kein Profil? Füge es direkt hinzu, damit auch andere
            Mitglieder über darüber erfahren können.
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
                    to={`/organization/${slug}/edit`}
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
