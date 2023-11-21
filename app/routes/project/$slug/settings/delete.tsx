import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProjectMode } from "../../utils.server";
import { getProfileByUserId, getProjectBySlug } from "./delete.server";
import { deleteProjectBySlug } from "./utils.server";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

const schema = z.object({
  projectName: z.string().optional(),
});

const environmentSchema = z.object({ slug: z.string(), name: z.string() });

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/project/settings/delete",
  ]);
  const authClient = createAuthClient(request, response);

  await checkFeatureAbilitiesOrThrow(authClient, "projects");

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const project = await getProjectBySlug(slug);
  invariantResponse(project, t("error.notFound.project"), { status: 404 });

  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  return json(
    {
      projectName: project.name,
    },
    { headers: response.headers }
  );
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (values.projectName !== environment.name) {
      throw new InputError(t("error.inputError"), "projectName");
    }
    try {
      await deleteProjectBySlug(environment.slug);
    } catch (error) {
      throw t("error.serverError");
    }
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/project/settings/delete",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "projects");
  const project = await getProjectBySlug(slug);
  invariantResponse(project, t("error.notFound.project"), { status: 404 });
  const profile = await getProfileByUserId(sessionUser.id);
  invariantResponse(profile, t("error.notFound.profile"), { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { slug: slug, name: project.name },
  });

  if (result.success === true) {
    return redirect(`/profile/${profile.username}`, {
      headers: response.headers,
    });
  }

  return json(result, { headers: response.headers });
};

function Delete() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(["routes/project/settings/delete"]);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>

      <p className="mb-8">
        {t("content.confirmation", { name: loaderData.projectName })}
      </p>

      <RemixForm method="post" schema={schema}>
        {({ Field, Errors, register }) => (
          <>
            <Field name="projectName" className="mb-4">
              {({ Errors }) => (
                <>
                  <Input
                    id="projectName"
                    label={t("content.label")}
                    {...register("projectName")}
                  />
                  <Errors />
                </>
              )}
            </Field>
            <button
              type="submit"
              className="btn btn-outline-primary ml-auto btn-small"
            >
              {t("content.delete")}
            </button>
            <Errors />
          </>
        )}
      </RemixForm>
    </>
  );
}

export default Delete;
