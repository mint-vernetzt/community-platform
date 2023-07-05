import type { ActionArgs, LoaderArgs } from "@remix-run/node";
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
import type { InferType } from "yup";
import { array, object, string } from "yup";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import { objectListOperationResolver } from "~/lib/utils/components";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { socialMediaServices } from "~/lib/utils/socialMediaServices";
import type { FormError } from "~/lib/utils/yup";
import {
  getFormDataValidationResultOrThrow,
  multiline,
  nullOrString,
  phone,
  social,
  website,
} from "~/lib/utils/yup";
import { getDisciplines, getTargetGroups } from "~/utils.server";
import {
  getProjectBySlugOrThrow,
  getProjectVisibilitiesBySlugOrThrow,
} from "../utils.server";
import {
  checkOwnershipOrThrow,
  transformFormToProject,
  transformProjectToForm,
  updateProjectById,
} from "./utils.server";

const schema = object({
  userId: string().required(),
  name: string().required(),
  headline: string(),
  excerpt: nullOrString(multiline()),
  description: nullOrString(multiline()),
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
  targetGroups: array(string().required()).required(),
  disciplines: array(string().required()).required(),
  submit: string().required(),
  privateFields: array(string().required()).required(),
});

type FormType = InferType<typeof schema>;

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const project = await getProjectBySlugOrThrow(slug);
  const projectVisibilities = await getProjectVisibilitiesBySlugOrThrow(slug);

  await checkOwnershipOrThrow(project, sessionUser);

  const targetGroups = await getTargetGroups();
  const disciplines = await getDisciplines();

  return json(
    {
      userId: sessionUser.id,
      project: transformProjectToForm(project),
      projectVisibilities,
      targetGroups,
      disciplines,
    },
    { headers: response.headers }
  );
};

export const action = async (args: ActionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const project = await getProjectBySlugOrThrow(slug);
  await checkOwnershipOrThrow(project, sessionUser);

  const result = await getFormDataValidationResultOrThrow<typeof schema>(
    request,
    schema
  );

  let updated = false;

  let errors = result.errors;
  let data = result.data;

  const formData = await request.clone().formData();

  if (result.data.submit === "submit") {
    if (result.errors === null) {
      const data = transformFormToProject(result.data);
      const { privateFields, ...projectData } = data;
      await updateProjectById(project.id, projectData, privateFields);
      updated = true;
    }
  } else {
    const listData: (keyof FormType)[] = ["targetGroups", "disciplines"];
    listData.forEach((key) => {
      data = objectListOperationResolver<FormType>(data, key, formData);
    });
  }

  return json(
    {
      data,
      errors,
      updated,
      lastSubmit: (formData.get("submit") as string) ?? "",
    },
    { headers: response.headers }
  );
};

function General() {
  const { slug } = useParams();

  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const {
    project: originalProject,
    projectVisibilities,
    targetGroups,
    disciplines,
  } = loaderData;

  const transition = useTransition();
  const isSubmitting = transition.state === "submitting";

  const project = actionData?.data ?? originalProject;

  const methods = useForm<FormType>();
  const {
    register,
    reset,
    formState: { isDirty },
  } = methods;

  const formRef = React.createRef<HTMLFormElement>();

  let errors: FormError | null = null;
  if (actionData !== undefined) {
    errors = actionData.errors;
  }

  const targetGroupOptions = targetGroups
    .filter((targetGroup) => {
      return !project.targetGroups.includes(targetGroup.id);
    })
    .map((targetGroup) => {
      return {
        label: targetGroup.title,
        value: targetGroup.id,
      };
    });

  const selectedTargetGroups =
    project.targetGroups && targetGroups
      ? targetGroups
          .filter((targetGroup) =>
            project.targetGroups.includes(targetGroup.id)
          )
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  const disciplineOptions = disciplines
    .filter((discipline) => {
      return !project.disciplines.includes(discipline.id);
    })
    .map((discipline) => {
      return {
        label: discipline.title,
        value: discipline.id,
      };
    });

  const selectedDisciplines =
    project.disciplines && disciplines
      ? disciplines
          .filter((item) => project.disciplines.includes(item.id))
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  React.useEffect(() => {
    if (isSubmitting && formRef.current !== null) {
      const $inputsToClear =
        formRef.current.getElementsByClassName("clear-after-submit");
      if ($inputsToClear) {
        Array.from($inputsToClear).forEach(
          (a) => ((a as HTMLInputElement).value = "")
        );
      }
    }
  }, [isSubmitting, formRef]);

  React.useEffect(() => {
    if (actionData !== undefined) {
      if (actionData.data.submit === "submit" && actionData.errors !== null) {
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
    }
  }, [actionData]);

  const isFormChanged =
    isDirty || (actionData !== undefined && actionData.updated === false);

  return (
    <FormProvider {...methods}>
      <Form
        ref={formRef}
        method="post"
        onSubmit={() => {
          reset({}, { keepValues: true });
        }}
      >
        <h1 className="mb-8">Dein Projekt</h1>
        <h4 className="mb-4 font-semibold">Allgemein</h4>
        <p className="mb-8">Lorem ipsum</p>
        <input name="userId" defaultValue={loaderData.userId} hidden />
        <div className="mb-6">
          <InputText
            {...register("name")}
            id="name"
            label="Name"
            defaultValue={project.name}
            errorMessage={errors?.name?.message}
            withPublicPrivateToggle={false}
            isPublic={projectVisibilities.name}
          />
        </div>
        <div className="flex flex-col md:flex-row -mx-4 mb-2">
          <div className="basis-full md:basis-6/12 px-4 mb-6">
            <InputText
              {...register("email")}
              id="email"
              label="E-Mail"
              defaultValue={project.email || ""}
              errorMessage={errors?.email?.message}
              withPublicPrivateToggle={false}
              isPublic={projectVisibilities.email}
            />
          </div>
          <div className="basis-full md:basis-6/12 px-4 mb-6">
            <InputText
              {...register("phone")}
              id="phone"
              label="Telefon"
              defaultValue={project.phone || ""}
              errorMessage={errors?.phone?.message}
              withPublicPrivateToggle={false}
              isPublic={projectVisibilities.phone}
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
              defaultValue={project.street || ""}
              errorMessage={errors?.street?.message}
              withPublicPrivateToggle={false}
              isPublic={projectVisibilities.street}
            />
          </div>
          <div className="basis-full md:basis-6/12 px-4 mb-6">
            <InputText
              {...register("streetNumber")}
              id="streetNumber"
              label="Hausnummer"
              defaultValue={project.streetNumber || ""}
              errorMessage={errors?.streetNumber?.message}
              withPublicPrivateToggle={false}
              isPublic={projectVisibilities.streetNumber}
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row -mx-4 mb-2">
          <div className="basis-full md:basis-6/12 px-4 mb-6">
            <InputText
              {...register("zipCode")}
              id="zipCode"
              label="PLZ"
              defaultValue={project.zipCode || ""}
              errorMessage={errors?.zipCode?.message}
              withPublicPrivateToggle={false}
              isPublic={projectVisibilities.zipCode}
            />
          </div>
          <div className="basis-full md:basis-6/12 px-4 mb-6">
            <InputText
              {...register("city")}
              id="city"
              label="Stadt"
              defaultValue={project.city || ""}
              errorMessage={errors?.city?.message}
              withPublicPrivateToggle={false}
              isPublic={projectVisibilities.city}
            />
          </div>
        </div>
        <hr className="border-neutral-400 my-10 lg:my-16" />

        <h4 className="font-semibold mb-4">Über das Projekt</h4>

        <p className="mb-8">Teile der Community mehr über Dein Projekt mit.</p>

        <div className="mb-6">
          <InputText
            {...register("headline")}
            id="headline"
            label="Überschrift"
            defaultValue={project.headline || ""}
            errorMessage={errors?.headline?.message}
            withPublicPrivateToggle={false}
            isPublic={projectVisibilities.headline}
          />
        </div>
        <div className="mb-4">
          <TextAreaWithCounter
            {...register("excerpt")}
            id="excerpt"
            defaultValue={project.excerpt || ""}
            label="Kurzbeschreibung"
            errorMessage={errors?.excerpt?.message}
            withPublicPrivateToggle={false}
            isPublic={projectVisibilities.excerpt}
          />
        </div>
        <div className="mb-4">
          <TextAreaWithCounter
            {...register("description")}
            id="description"
            defaultValue={project.description || ""}
            label="Ausführliche Beschreibung"
            errorMessage={errors?.description?.message}
            withPublicPrivateToggle={false}
            isPublic={projectVisibilities.description}
          />
        </div>
        <div className="mb-4">
          <SelectAdd
            name="targetGroups"
            label={"Zielgruppen"}
            placeholder="Füge die Zielgruppen hinzu."
            entries={selectedTargetGroups.map((targetGroup) => ({
              label: targetGroup.title,
              value: targetGroup.id,
            }))}
            options={targetGroupOptions}
            withPublicPrivateToggle={false}
            isPublic={projectVisibilities.targetGroups}
          />
        </div>
        <div className="mb-4">
          <SelectAdd
            name="disciplines"
            label={"Disziplinen"}
            placeholder="Füge die Disziplinen hinzu."
            entries={selectedDisciplines.map((item) => ({
              label: item.title,
              value: item.id,
            }))}
            options={disciplineOptions}
            withPublicPrivateToggle={false}
            isPublic={projectVisibilities.disciplines}
          />
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
            defaultValue={project.website || ""}
            placeholder="domainname.tld"
            errorMessage={errors?.website?.message}
            withClearButton
            withPublicPrivateToggle={false}
            isPublic={projectVisibilities.website}
          />
        </div>

        <hr className="border-neutral-400 my-10 lg:my-16" />

        <h4 className="mb-4 font-semibold">Soziale Netzwerke</h4>

        <p className="mb-8">
          In welchen Netzwerken ist Dein Projekt vertreten?
        </p>

        {socialMediaServices.map((service) => {
          return (
            <div className="w-full mb-4" key={service.id}>
              <InputText
                {...register(service.id)}
                id={service.id}
                label={service.label}
                defaultValue={project[service.id] || ""}
                placeholder={service.organizationPlaceholder}
                errorMessage={errors?.[service.id]?.message}
                withClearButton
                withPublicPrivateToggle={false}
                isPublic={projectVisibilities[service.id]}
              />
            </div>
          );
        })}

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

              {isFormChanged ? (
                <Link
                  to={`/project/${slug}/settings`}
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
  );
}

export default General;
