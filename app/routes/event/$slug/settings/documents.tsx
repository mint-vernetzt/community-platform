import { useState } from "react";
import { Link, LoaderFunction, useFetcher, useLoaderData } from "remix";
import { Form as RemixForm } from "remix-forms";
import { getUserByRequestOrThrow } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import Modal from "~/components/Modal/Modal";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import {
  ActionData as DeleteDocumentActionData,
  deleteDocumentSchema,
} from "./documents/delete-document";
import {
  ActionData as EditDocumentActionData,
  editDocumentSchema,
} from "./documents/edit-document";
import {
  ActionData as UploadDocumentActionData,
  uploadDocumentSchema,
} from "./documents/upload-document";
import { checkOwnershipOrThrow } from "./utils.server";

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

function closeModal(index: number) {
  const $modalToggle = document.getElementById(
    `modal-edit-document-${index}`
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
                    htmlFor={`modal-edit-document-${index}`}
                    className="btn btn-outline-primary ml-auto btn-small mt-2 mx-2"
                  >
                    Editieren
                  </label>
                  <Modal id={`modal-edit-document-${index}`}>
                    <RemixForm
                      method="post"
                      fetcher={editDocumentFetcher}
                      action={`/event/${loaderData.event.slug}/settings/documents/edit-document`}
                      schema={editDocumentSchema}
                      onSubmit={(event) => {
                        closeModal(index);
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
