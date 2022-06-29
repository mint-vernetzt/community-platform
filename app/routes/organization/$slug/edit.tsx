import { Organization, OrganizationType } from "@prisma/client";
import { FormProvider, useForm } from "react-hook-form";
import {
  ActionFunction,
  Form,
  LoaderFunction,
  useActionData,
  useLoaderData,
} from "remix";
import { badRequest, forbidden, notFound, serverError } from "remix-utils";
import { array, InferType, object, string } from "yup";
import { getUserByRequest } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import SelectField from "~/components/FormElements/SelectField/SelectField";
import { capitalizeFirstLetter } from "~/lib/string/transform";
import { prismaClient } from "~/prisma";

const organizationSchema = object({
  name: string().required(),
  email: string().email(),
  phone: string(),
  street: string(),
  streetNumber: string(),
  zipCode: string(),
  city: string(),
  website: string(),
  logo: string(),
  background: string(),
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
  teamMembers: array(string().required()).required(),
  memberOf: array(string().required()).required(),
  networkMembers: array(string().required()).required(),
  areas: array(string().required()).required(),
});

type OrganizationFormType = InferType<typeof organizationSchema>;

type LoaderData = {
  organization: OrganizationFormType;
  organizationTypes: OrganizationType[];
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
        areas: {
          select: {
            areaId: true,
          },
        },
        types: {
          select: {
            organizationTypeId: true,
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

  return { organization, organizationTypes };
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
      teamMembers: (formData.getAll("teamMembers") ?? []) as string[],
      memberOf: (formData.getAll("memberOf") ?? []) as string[],
      networkMembers: (formData.getAll("networkMembers") ?? []) as string[],
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
    profile: OrganizationFormType
  ) => {
    return {
      ...profile,
      [name]: [...(profile[name] as string[]), value],
    };
  };

  const removeListEntry = (
    name: keyof OrganizationFormType,
    value: string,
    profile: OrganizationFormType
  ) => {
    return {
      ...profile,
      [name]: (profile[name] as string[]).filter(
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

  const formData = await request.clone().formData();

  const listData: (keyof OrganizationFormType)[] = [
    "types",
    "memberOf",
    "networkMembers",
    "teamMembers",
    "areas",
  ];

  listData.forEach((name) => {
    data = organizationListOperationResolver(data, name, formData);
  });

  // console.log("data", data);

  // try {
  //   await prismaClient.organization.update({
  //     where: {
  //       slug,
  //     },
  //     data: {
  //       ...data,
  //     },
  //   });
  // } catch (error) {
  //   console.error(error);
  //   throw serverError({ message: "Something went wrong on update." });
  // }

  return {
    organization: data,
  };
};

function Edit() {
  const { organization: dbOrganization, organizationTypes } =
    useLoaderData<LoaderData>();
  const actionData = useActionData();

  const organization = actionData?.organization ?? dbOrganization;

  console.log(organization);

  const methods = useForm<OrganizationFormType>({
    defaultValues: organization,
  });

  const { register, reset } = methods;

  const errors = undefined;

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

  console.log(selectedOrganizationTypes);

  return (
    <FormProvider {...methods}>
      <Form
        method="post"
        onSubmit={(e: React.SyntheticEvent) => {
          reset({}, { keepValues: true });
        }}
      >
        <h1 className="mb-8">Institutionelle Daten</h1>

        <h4 className="mb-4 font-semibold">Allgemein</h4>

        <p className="mb-8">
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
          nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
          sed diam voluptua.
        </p>
        <InputText
          {...register("name")}
          id="name"
          label="Name"
          defaultValue={organization.name}
          errorMessage={errors?.position?.message}
        />
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
        <button
          type="submit"
          name="submit"
          value="submit"
          className="btn btn-primary ml-4"
        >
          Speichern
        </button>
      </Form>
    </FormProvider>
  );
}

export default Edit;
