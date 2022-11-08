import { ActionFunction, LoaderFunction, redirect, useLoaderData } from "remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest } from "remix-utils";
import { z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
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

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "projects");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);
  const project = await getProjectBySlugOrThrow(slug);

  await checkOwnershipOrThrow(project, currentUser);

  return {
    userId: currentUser.id,
    projectId: project.id,
    projectName: project.name,
  };
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
      "Der Name der Veranstaltung ist nicht korrekt",
      "projectName"
    );
  }
  try {
    await deleteProjectById(values.projectId);
  } catch (error) {
    throw "Die Veranstaltung konnte nicht gelöscht werden.";
  }
});

export const action: ActionFunction = async (args) => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "projects");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);

  await checkIdentityOrThrow(request, currentUser);

  const project = await getProjectBySlugOrThrow(slug);

  await checkOwnershipOrThrow(project, currentUser);

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
    return redirect(`/profile/${currentUser.user_metadata.username}`);
  }

  return result;
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
