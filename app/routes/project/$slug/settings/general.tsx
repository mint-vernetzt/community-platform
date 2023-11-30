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
import type { InferType } from "yup";
import { array, object, string } from "yup";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import { objectListOperationResolver } from "~/lib/utils/components";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { createSocialMediaServices } from "~/lib/utils/socialMediaServices";
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
import { getProjectVisibilitiesBySlugOrThrow } from "../utils.server";
import {
  transformFormToProject,
  transformProjectToForm,
  updateProjectById,
} from "./utils.server";

import quillStyles from "react-quill/dist/quill.snow.css";
import { invariantResponse } from "~/lib/utils/response";
import { deriveProjectMode } from "../../utils.server";
import { getProjectBySlug, getProjectBySlugForAction } from "./general.server";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";

const i18nNS = ["routes/project/settings/index"];
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return object({
    name: string().required(),
    headline: string(),
    excerpt: nullOrString(multiline()),
    description: nullOrString(multiline()),
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
    targetGroups: array(string().required()).required(),
    disciplines: array(string().required()).required(),
    submit: string().required(),
    privateFields: array(string().required()).required(),
  });
};

type SchemaType = ReturnType<typeof createSchema>;
type FormType = InferType<SchemaType>;

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/project/settings/general",
  ]);

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const project = await getProjectBySlug(slug);
  invariantResponse(project, t("error.notFound"), { status: 404 });
  const projectVisibilities = await getProjectVisibilitiesBySlugOrThrow(slug);
  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const targetGroups = await getTargetGroups();
  const disciplines = await getDisciplines();

  return json(
    {
      project: transformProjectToForm(project),
      projectVisibilities,
      targetGroups,
      disciplines,
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

  const t = await i18next.getFixedT(request, [
    "routes/project/settings/general",
  ]);
  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const project = await getProjectBySlugForAction(slug);
  invariantResponse(project, t("error.notFound"), { status: 404 });
  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const result = await getFormDataValidationResultOrThrow<SchemaType>(
    request,
    createSchema(t)
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
  const { t } = useTranslation([
    "routes/project/settings/general",
    "utils/social-media-services",
  ]);
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
          // TODO: can this type assertion be removed and proofen by code?
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
        <h1 className="mb-8">{t("content.headline")}</h1>
        <h4 className="mb-4 font-semibold">{t("content.general.headline")}</h4>
        <p className="mb-8">{t("content.general.intro")}</p>
        <div className="mb-6">
          <InputText
            {...register("name")}
            id="name"
            label={t("form.name.label")}
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
              label={t("form.email.label")}
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
              label={t("form.phone.label")}
              defaultValue={project.phone || ""}
              errorMessage={errors?.phone?.message}
              withPublicPrivateToggle={false}
              isPublic={projectVisibilities.phone}
            />
          </div>
        </div>
        <h4 className="mb-4 font-semibold">{t("content.address.headline")}</h4>
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="basis-full md:basis-6/12 px-4 mb-6">
            <InputText
              {...register("street")}
              id="street"
              label={t("form.street.label")}
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
              label={t("form.streetNumber.label")}
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
              label={t("form.zipCode.label")}
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
              label={t("form.city.label")}
              defaultValue={project.city || ""}
              errorMessage={errors?.city?.message}
              withPublicPrivateToggle={false}
              isPublic={projectVisibilities.city}
            />
          </div>
        </div>
        <hr className="border-neutral-400 my-10 lg:my-16" />

        <h4 className="font-semibold mb-4">{t("content.about.headline")}</h4>

        <p className="mb-8">{t("content.about.intro")}</p>

        <div className="mb-6">
          <InputText
            {...register("headline")}
            id="headline"
            label={t("form.headline.label")}
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
            label={t("form.excerpt.label")}
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
            label={t("form.description.label")}
            errorMessage={errors?.description?.message}
            maxCharacters={2000}
            withPublicPrivateToggle={false}
            isPublic={projectVisibilities.description}
            rte
          />
          {errors?.description?.message ? (
            <div>{errors.description.message}</div>
          ) : null}
        </div>
        <div className="mb-4">
          <SelectAdd
            name="targetGroups"
            label={t("form.targetGroups.label")}
            placeholder={t("form.targetGroups.placeholder")}
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
            label={t("form.disciplines.label")}
            placeholder={t("form.disciplines.placeholder")}
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
            defaultValue={project.website || ""}
            placeholder={t("form.website.placeholder")}
            errorMessage={errors?.website?.message}
            withClearButton
            withPublicPrivateToggle={false}
            isPublic={projectVisibilities.website}
          />
        </div>

        <hr className="border-neutral-400 my-10 lg:my-16" />

        <h4 className="mb-4 font-semibold">
          {t("content.websiteAndSocial.social.headline")}
        </h4>

        <p className="mb-8">{t("content.websiteAndSocial.social.intro")}</p>

        {createSocialMediaServices(t).map((service) => {
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

        <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0 pb-24 md:pb-0">
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
                {t("form.submit.label")}
              </button>
            </div>
          </div>
        </footer>
      </Form>
    </FormProvider>
  );
}

export default General;
