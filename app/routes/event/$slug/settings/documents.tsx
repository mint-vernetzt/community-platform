import { Document } from "@prisma/client";
import { DataFunctionArgs } from "@remix-run/server-runtime";
import { ActionFunction, Link, LoaderFunction, useLoaderData } from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest, serverError } from "remix-utils";
import { z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { upload } from "~/storage.server";
import { getEventBySlugOrThrow } from "../utils.server";
import {
  checkIdentityOrThrow,
  checkOwnershipOrThrow,
  createDocumentOnEvent,
} from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  uploadKey: z.string(),
  document: z.unknown(),
  submit: z.string(),
});

// TODO: args: z.object( request: z.unknown(), params, ...)
const environmentSchema = z.object({ args: z.unknown() });

type LoaderData = {
  userId: string;
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  return {
    userId: currentUser.id,
    event: event,
  };
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  console.log("\nVALUES:\n", values);
  console.log("\nENVIRONMENT:\n", environment);

  const { request, params } = environment.args as DataFunctionArgs;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);

  await checkIdentityOrThrow(request, currentUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  if (values.eventId !== event.id) {
    throw new Error("Id nicht korrekt");
  }

  // TODO: switch (submit value)
  // upload
  // TODO: Handle empty upload
  if (values.submit === "upload") {
    const formData = await upload(request, "documents");
    const uploadHandlerResponseJSON = formData.get("document");
    if (uploadHandlerResponseJSON === null) {
      throw new Error("Das hochladen des Dokumentes ist fehlgeschlagen.");
    }
    const uploadHandlerResponse: {
      buffer: Buffer;
      path: string;
      filename: string;
      mimeType: string;
      sizeInBytes: number;
    } = JSON.parse(uploadHandlerResponseJSON as string);

    const document: Pick<
      Document,
      "filename" | "path" | "sizeInMB" | "mimeType"
    > = {
      filename: uploadHandlerResponse.filename,
      path: uploadHandlerResponse.path,
      sizeInMB:
        Math.round((uploadHandlerResponse.sizeInBytes / 1024 / 1024) * 100) /
        100,
      mimeType: uploadHandlerResponse.mimeType,
    };
    try {
      await createDocumentOnEvent(event.id, document);
    } catch (error) {
      console.log(error);
      throw new Error(
        "Dokument konnte nicht in der Datenbank gespeichert werden."
      );
    }
  }
  // edit
  // delete
  return values;
});

export const action: ActionFunction = async (args) => {
  const { request } = args;

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { args: args },
  });

  if (result.success === false) {
    if (result.errors._global !== undefined) {
      if (result.errors._global.includes("Id nicht korrekt")) {
        throw badRequest({ message: "Id nicht korrekt" });
      }
      if (
        result.errors._global.includes(
          "Dokument konnte nicht in der Datenbank gespeichert werden."
        )
      ) {
        throw serverError({
          message: "Dokument konnte nicht in der Datenbank gespeichert werden.",
        });
      }
      if (
        result.errors._global.includes(
          "Das hochladen des Dokumentes ist fehlgeschlagen."
        )
      ) {
        throw serverError({
          message: "Das hochladen des Dokumentes ist fehlgeschlagen.",
        });
      }
    }
  }
  return result;
};

function Documents() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <h1 className="mb-8">Dokumente verwalten</h1>

      {/* Show documents from loader data */}
      {/* For each document */}
      {/* - RemixForm to delete document with submit value delete */}
      {/* - Modal to edit document. Inside RemixForm with edit inputs and submit value edit */}
      {/* - Link to resource route for download with url parameter filename=${filename} */}
      {/* For all documents */}
      {/* - Link to resource route for download WITHOUT url parameter filename (meaning download all as zip) */}
      {loaderData.event.documents.length > 0 && (
        <div className="mb-8">
          <h3>Aktuelle Dokumente</h3>
          <ul>
            {loaderData.event.documents.map((item, index) => {
              return (
                <div
                  key={`document-${index}`}
                  className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
                >
                  <p>{item.document.title || item.document.filename}</p>
                  {/* TODO: Round size */}
                  <p className="mx-4">{item.document.sizeInMB} MB</p>
                  {/* TODO: Provide download on resource route */}
                  <Link
                    className="btn btn-outline-primary ml-auto btn-small mt-2 mx-2"
                    to={`/event/${
                      loaderData.event.slug
                    }/settings/documents-download?path=${
                      item.document.path
                    }&filename=${
                      item.document.title || item.document.filename
                    }`}
                    reloadDocument
                  >
                    Herunterladen
                  </Link>
                  {/* TODO: Wrap edit Form inside Modal */}
                  <button className="btn btn-outline-primary ml-auto btn-small mt-2 mx-2">
                    Editieren
                  </button>
                  <RemixForm method="post" schema={schema}>
                    {({ Field, Errors }) => (
                      <>
                        <Field name="submit" hidden value="delete" />
                        <Field name="userId" hidden value={loaderData.userId} />
                        <Field
                          name="eventId"
                          hidden
                          value={loaderData.event.id}
                        />
                        <button
                          type="submit"
                          className="btn btn-outline-primary ml-auto btn-small mt-2"
                        >
                          Löschen
                        </button>
                        <Errors />
                      </>
                    )}
                  </RemixForm>
                </div>
              );
            })}
          </ul>
          <Link
            className="btn btn-outline btn-primary mt-4"
            to={`/event/${loaderData.event.slug}/settings/documents-download`}
            reloadDocument
          >
            Alle Herunterladen
          </Link>
        </div>
      )}

      <RemixForm method="post" schema={schema} encType="multipart/form-data">
        {({ Field, Errors, register }) => (
          <>
            <Field name="submit" hidden value="upload" />
            <Field name="userId" hidden value={loaderData.userId} />
            <Field name="eventId" hidden value={loaderData.event.id} />
            <Field name="uploadKey" hidden value={"document"} />
            <Field name="document" label="PDF Dokument auswählen">
              {({ Errors }) => (
                <>
                  <input
                    type="file"
                    accept="application/pdf"
                    {...register("document")}
                  />
                  <Errors />
                </>
              )}
            </Field>
            <button
              type="submit"
              className="btn btn-outline-primary ml-auto btn-small mt-2"
            >
              PDF Dokument hochladen
            </button>
            <Errors />
          </>
        )}
      </RemixForm>
    </>
  );
}

export default Documents;
