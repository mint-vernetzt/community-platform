import { Document } from "@prisma/client";
import { DataFunctionArgs } from "@remix-run/server-runtime";
import { useState } from "react";
import {
  ActionFunction,
  Link,
  LoaderFunction,
  useFetcher,
  useLoaderData,
} from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { badRequest, serverError } from "remix-utils";
import { z } from "zod";
import { getUserByRequestOrThrow, resetPassword } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import Modal from "~/components/Modal/Modal";
import { updateDocument } from "~/document.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { upload } from "~/storage.server";
import { getEventBySlugOrThrow } from "../utils.server";
import {
  ActionData as DeleteDocumentActionData,
  deleteDocumentSchema,
} from "./documents/delete-document";
import {
  ActionData as EditDocumentActionData,
  editDocumentSchema,
} from "./documents/edit-document";
import { disconnectDocumentFromEvent } from "./documents/utils.server";
import {
  checkIdentityOrThrow,
  checkOwnershipOrThrow,
  createDocumentOnEvent,
} from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  uploadKey: z.string().optional(),
  document: z.unknown().optional(),
  documentId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  submit: z.string(),
});

const environmentSchema = z.object({
  args: z.object({
    request: z.unknown(),
    context: z.unknown(),
    params: z.unknown(),
  }),
});

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
      throw new Error(
        "Dokument konnte nicht in der Datenbank gespeichert werden."
      );
    }
  } else if (values.submit === "edit") {
    if (values.documentId === undefined) {
      throw new Error("Dokument konnte nicht editiert werden.");
    }
    try {
      await updateDocument(values.documentId, {
        title: values.title || null,
        description: values.description || null,
      });
    } catch (error) {
      throw new Error(
        "Dokument konnte nicht aus der Datenbank gelöscht werden."
      );
    }
  } else if (values.submit === "delete") {
    if (values.documentId === undefined) {
      throw new Error(
        "Dokument konnte nicht aus der Datenbank gelöscht werden."
      );
    }
    try {
      await disconnectDocumentFromEvent(values.documentId);
    } catch (error) {
      throw new Error(
        "Dokument konnte nicht aus der Datenbank gelöscht werden."
      );
    }
  }
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
          "Dokument konnte nicht aus der Datenbank gelöscht werden."
        )
      ) {
        throw serverError({
          message: "Dokument konnte nicht aus der Datenbank gelöscht werden.",
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
      if (
        result.errors._global.includes("Dokument konnte nicht editiert werden.")
      ) {
        throw serverError({
          message: "Dokument konnte nicht editiert werden.",
        });
      }
    }
  }
  return result;
};

function Documents() {
  const loaderData = useLoaderData<LoaderData>();

  const editDocumentFetcher = useFetcher<EditDocumentActionData>();
  const deleteDocumentFetcher = useFetcher<DeleteDocumentActionData>();

  const [fileSelected, setFileSelected] = useState(false);
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileSelected(true);
    }
  };

  return (
    <>
      <h1 className="mb-8">Dokumente verwalten</h1>
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
                  <p className="mx-4">{item.document.sizeInMB} MB</p>
                  <Link
                    className="btn btn-outline-primary ml-auto btn-small mt-2 mx-2"
                    to={`/event/${loaderData.event.slug}/documents-download?document_id=${item.document.id}`}
                    reloadDocument
                  >
                    Herunterladen
                  </Link>
                  <label
                    htmlFor="modal-background-upload"
                    className="btn btn-outline-primary ml-auto btn-small mt-2 mx-2"
                  >
                    Editieren
                  </label>
                  <Modal id="modal-background-upload">
                    <RemixForm
                      method="post"
                      fetcher={editDocumentFetcher}
                      action={`/event/${loaderData.event.slug}/settings/documents/edit-document`}
                      schema={editDocumentSchema}
                      // TODO: How to close modal after submit?
                      //reloadDocument
                    >
                      {({ Field, Errors, register }) => (
                        <>
                          <Field
                            name="userId"
                            hidden
                            value={loaderData.userId}
                          />
                          <Field
                            name="documentId"
                            hidden
                            value={item.document.id}
                          />
                          <Field
                            name="eventId"
                            hidden
                            value={loaderData.event.id}
                          />
                          <Field name="title">
                            {({ Errors }) => (
                              <>
                                <InputText
                                  {...register("title")}
                                  id="title"
                                  label="Titel"
                                  defaultValue={
                                    item.document.title ||
                                    item.document.filename
                                  }
                                />
                                <Errors />
                              </>
                            )}
                          </Field>
                          <Field name="description">
                            {({ Errors }) => (
                              <>
                                <TextAreaWithCounter
                                  {...register("description")}
                                  id="description"
                                  label="Beschreibung"
                                  defaultValue={item.document.description || ""}
                                  maxCharacters={100}
                                />
                                <Errors />
                              </>
                            )}
                          </Field>
                          <button
                            type="submit"
                            className="btn btn-outline-primary ml-auto btn-small mt-2"
                          >
                            Speichern
                          </button>
                          <Errors />
                          <Link
                            to={`/event/${loaderData.event.slug}/settings/documents`}
                            reloadDocument
                            className={`btn btn-outline-primary ml-auto btn-small mt-2 ml-4`}
                          >
                            Abbrechen
                          </Link>
                        </>
                      )}
                    </RemixForm>
                  </Modal>
                  <RemixForm
                    method="post"
                    fetcher={deleteDocumentFetcher}
                    action={`/event/${loaderData.event.slug}/settings/documents/delete-document`}
                    schema={deleteDocumentSchema}
                  >
                    {({ Field, Errors }) => (
                      <>
                        <Field name="userId" hidden value={loaderData.userId} />
                        <Field
                          name="documentId"
                          hidden
                          value={item.document.id}
                        />
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
            to={`/event/${loaderData.event.slug}/documents-download`}
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
                    onChange={onSelectFile}
                  />
                  <Errors />
                </>
              )}
            </Field>
            <button
              type="submit"
              className="btn btn-outline-primary ml-auto btn-small mt-2"
              disabled={!fileSelected}
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
