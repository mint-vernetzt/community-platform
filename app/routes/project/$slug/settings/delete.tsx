import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest } from "remix-utils";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { checkIdentityOrThrow, deriveProjectMode } from "../../utils.server";
import { getProfileByUserId, getProjectBySlug } from "./delete.server";
import { deleteProjectById } from "./utils.server";

const schema = z.object({
  userId: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
});

const environmentSchema = z.object({ id: z.string(), name: z.string() });

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const project = await getProjectBySlug(slug);
  invariantResponse(project, "Project not found", { status: 404 });

  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  return json(
    {
      userId: sessionUser.id,
      projectId: project.id,
      projectName: project.name,
    },
    { headers: response.headers }
  );
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (values.projectId !== environment.id) {
    throw new Error("Id nicht korrekt");
  }
  if (values.projectName !== environment.name) {
    throw new InputError(
      "Der Name des Projekts ist nicht korrekt",
      "projectName"
    );
  }
  try {
    await deleteProjectById(values.projectId);
  } catch (error) {
    throw "Das Projekt konnte nicht gelöscht werden.";
  }
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);

  await checkIdentityOrThrow(request, sessionUser);

  await checkFeatureAbilitiesOrThrow(authClient, "projects");

  const project = await getProjectBySlug(slug);
  invariantResponse(project, "Project not found", { status: 404 });

  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const profile = await getProfileByUserId(sessionUser.id);
  invariantResponse(profile, "Profile not found", { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { id: project.id, name: project.name },
  });

  if (result.success === false) {
    if (
      result.errors._global !== undefined &&
      result.errors._global.includes("Id nicht korrekt")
    ) {
      throw badRequest({ message: "Id nicht korrekt" });
    }
  } else {
    return redirect(`/profile/${profile.username}`, {
      headers: response.headers,
    });
  }

  return json(result, { headers: response.headers });
};

function Delete() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 className="mb-8">Projekt löschen</h1>

      <p className="mb-8">
        Bitte gib den Namen des Projekts "{loaderData.projectName}" ein, um das
        Löschen zu bestätigen. Wenn Du danach auf "Projekt löschen” klickst,
        wird Euer Projekt ohne erneute Abfrage gelöscht.
      </p>

      <RemixForm method="post" schema={schema}>
        {({ Field, Errors, register }) => (
          <>
            <Field name="userId" hidden value={loaderData.userId} />
            <Field name="projectId" hidden value={loaderData.projectId} />
            <Field name="projectName" className="mb-4">
              {({ Errors }) => (
                <>
                  <Input
                    id="projectName"
                    label="Löschung bestätigen"
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
              Projekt löschen
            </button>
            <Errors />
          </>
        )}
      </RemixForm>
    </>
  );
}

export default Delete;
