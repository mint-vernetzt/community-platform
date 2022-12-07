import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest } from "remix-utils";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getProfileByUserId } from "~/profile.server";
import { checkIdentityOrThrow } from "../../utils.server";
import { getProjectBySlugOrThrow } from "../utils.server";
import { checkOwnershipOrThrow, deleteProjectById } from "./utils.server";

const schema = z.object({
  userId: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
});

const environmentSchema = z.object({ id: z.string(), name: z.string() });

type LoaderData = {
  userId: string;
  projectId: string;
  projectName: string;
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const project = await getProjectBySlugOrThrow(slug);

  await checkOwnershipOrThrow(project, sessionUser);

  return json<LoaderData>(
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

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action: ActionFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);

  await checkIdentityOrThrow(request, sessionUser);

  const project = await getProjectBySlugOrThrow(slug);

  await checkOwnershipOrThrow(project, sessionUser);

  const profile = await getProfileByUserId(sessionUser.id, ["username"]);

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

  return json<ActionData>(result, { headers: response.headers });
};

function Delete() {
  const loaderData = useLoaderData<LoaderData>();

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
