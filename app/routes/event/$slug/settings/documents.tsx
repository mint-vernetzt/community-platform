import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { Form as RemixForm } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import Modal from "~/components/Modal/Modal";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import type { ActionData as DeleteDocumentActionData } from "./documents/delete-document";
import { deleteDocumentSchema } from "./documents/delete-document";
import type { ActionData as EditDocumentActionData } from "./documents/edit-document";
import { editDocumentSchema } from "./documents/edit-document";
import type { ActionData as UploadDocumentActionData } from "./documents/upload-document";
import { uploadDocumentSchema } from "./documents/upload-document";
import { checkOwnershipOrThrow } from "./utils.server";

type LoaderData = {
  userId: string;
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>;
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, sessionUser);

  return json<LoaderData>(
    {
      userId: sessionUser.id,
      event: event,
    },
    { headers: response.headers }
  );
};

function closeModal(id: string) {
  const $modalToggle = document.getElementById(
    `modal-edit-document-${id}`
  ) as HTMLInputElement | null;
  if ($modalToggle) {
    $modalToggle.checked = false;
  }
}

function clearFileInput() {
  const $fileInput = document.getElementById(
    "document-upload-input"
  ) as HTMLInputElement | null;
  if ($fileInput) {
    $fileInput.value = "";
  }
}

function Documents() {
  const loaderData = useLoaderData<LoaderData>();

  const uploadDocumentFetcher = useFetcher<UploadDocumentActionData>();
  const editDocumentFetcher = useFetcher<EditDocumentActionData>();
  const deleteDocumentFetcher = useFetcher<DeleteDocumentActionData>();

  const [fileSelected, setFileSelected] = useState(false);
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files[0].size > 5_000_000) {
        alert("Die Datei ist zu groß. Maximal 5MB.");
        clearFileInput();
        setFileSelected(false);
      } else {
        setFileSelected(true);
      }
    }
  };

  return (
    <>
      <h1 className="mb-8">Dokumente verwalten</h1>
      {loaderData.event.documents.length > 0 && (
        <div className="mb-8">
          <h3>Aktuelle Dokumente</h3>
          <ul>
            {loaderData.event.documents.map((item) => {
              return (
                <div
                  key={`document-${item.document.id}`}
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
                    htmlFor={`modal-edit-document-${item.document.id}`}
                    className="btn btn-outline-primary ml-auto btn-small mt-2 mx-2"
                  >
                    Editieren
                  </label>
                  <Modal id={`modal-edit-document-${item.document.id}`}>
                    <RemixForm
                      method="post"
                      fetcher={editDocumentFetcher}
                      action={`/event/${loaderData.event.slug}/settings/documents/edit-document`}
                      schema={editDocumentSchema}
                      onSubmit={(event) => {
                        closeModal(item.document.id);
                        // @ts-ignore
                        if (event.nativeEvent.submitter.name === "cancel") {
                          event.preventDefault();
                          event.currentTarget.reset();
                        }
                      }}
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
                          <Field
                            name="extension"
                            hidden
                            value={item.document.extension}
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
                          <button
                            type="submit"
                            name="cancel"
                            className="btn btn-outline-primary ml-auto btn-small mt-2"
                          >
                            Abbrechen
                          </button>
                          <Errors />
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

      <RemixForm
        method="post"
        fetcher={uploadDocumentFetcher}
        action={`/event/${loaderData.event.slug}/settings/documents/upload-document`}
        schema={uploadDocumentSchema}
        encType="multipart/form-data"
        onTransition={() => {
          clearFileInput();
          setFileSelected(false);
        }}
      >
        {({ Field, Errors }) => (
          <>
            <Field name="userId" hidden value={loaderData.userId} />
            <Field name="eventId" hidden value={loaderData.event.id} />
            <Field name="uploadKey" hidden value={"document"} />
            <Field name="document" label="PDF Dokument auswählen">
              {({ Errors }) => (
                <>
                  <input
                    id="document-upload-input"
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
