import { ActionFunction, LoaderFunction, useLoaderData } from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest } from "remix-utils";
import { z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  submit: z.string(),
});

const environmentSchema = z.object({ eventId: z.string() });

type LoaderData = {
  userId: string;
  eventId: string;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  // TODO: Get all documents from event

  return {
    userId: currentUser.id,
    eventId: event.id,
  };
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (values.eventId !== environment.eventId) {
    throw new Error("Id nicht korrekt");
  }
  console.log("SUBMIT VALUE:\n\n", values.submit);
  // TODO: switch (submit value)
  // upload
  // edit
  // delete
});

export const action: ActionFunction = async (args) => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);

  await checkIdentityOrThrow(request, currentUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { eventId: event.id },
  });

  if (result.success === false) {
    if (
      result.errors._global !== undefined &&
      result.errors._global.includes("Id nicht korrekt")
    ) {
      throw badRequest({ message: "Id nicht korrekt" });
    }
  }

  return result;
};

function Delete() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <h1 className="mb-8">Dokumente verwalten</h1>

      {/* Show documents from loader data */}
      {/* For each document */}
      {/* - RemixForm to delete document with submit value delete */}
      {/* - Modal to edit document. Inside RemixForm with edit inputs and submit value edit */}

      <RemixForm method="post" schema={schema}>
        {({ Field, Errors, register }) => (
          <>
            <Field name="submit" hidden value="upload" />
            <Field name="userId" hidden value={loaderData.userId} />
            <Field name="eventId" hidden value={loaderData.eventId} />
            <button
              type="submit"
              className="btn btn-outline-primary ml-auto btn-small"
            >
              Dokument hochladen
            </button>
            <Errors />
          </>
        )}
      </RemixForm>
    </>
  );
}

export default Delete;
