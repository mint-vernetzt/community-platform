import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import type { LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  redirect,
} from "react-router";
import { useState } from "react";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import { TextArea } from "~/components-next/TextArea";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { Modal } from "~/components-next/Modal";
import { deriveEventMode } from "../../utils.server";
import { getEventBySlug } from "./documents.server";
import {
  deleteDocumentSchema,
  type action as deleteDocumentAction,
} from "./documents/delete-document";
import {
  editDocumentSchema,
  type action as editDocumentAction,
} from "./documents/edit-document";
import {
  uploadDocumentSchema,
  type action as uploadDocumentAction,
} from "./documents/upload-document";
import { publishSchema, type action as publishAction } from "./events/publish";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings/documents"];
  const { authClient } = createAuthClient(request);

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const event = await getEventBySlug(slug);
  invariantResponse(event, locales.error.notFound, { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });

  return {
    event: event,
    locales,
  };
};

function clearFileInput() {
  // TODO: can this type assertion be removed and proofen by code?
  const $fileInput = document.getElementById(
    "document-upload-input"
  ) as HTMLInputElement | null;
  if ($fileInput) {
    $fileInput.value = "";
  }
}

function Documents() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const { slug } = useParams();

  const uploadDocumentFetcher = useFetcher<typeof uploadDocumentAction>();
  const editDocumentFetcher = useFetcher<typeof editDocumentAction>();
  const deleteDocumentFetcher = useFetcher<typeof deleteDocumentAction>();
  const publishFetcher = useFetcher<typeof publishAction>();

  const [fileSelected, setFileSelected] = useState(false);
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files[0].size > 5_000_000) {
        alert(locales.error.fileTooBig);
        clearFileInput();
        setFileSelected(false);
      } else {
        setFileSelected(true);
      }
    }
  };

  return (
    <>
      <h1 className="mb-8">{locales.content.headline}</h1>
      {loaderData.event.documents.length > 0 ? (
        <div className="mb-8">
          <h3>{locales.content.current.headline}</h3>
          <ul>
            {loaderData.event.documents.map((item) => {
              return (
                <div
                  key={`document-${item.document.id}`}
                  className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
                >
                  <div className="mr-2">
                    <p>{item.document.title || item.document.filename}</p>
                    <p>({Math.round(item.document.sizeInMB * 100) / 100} MB)</p>
                  </div>
                  <div className="ml-auto flex-1/2 @sm:mv-flex">
                    <Link
                      className="btn btn-outline-primary btn-small mt-2 mr-2 w-full @sm:mv-w-auto"
                      to={`/event/${loaderData.event.slug}/documents-download?document_id=${item.document.id}`}
                      reloadDocument
                    >
                      {locales.content.current.download}
                    </Link>
                    <Form
                      method="get"
                      className="mt-2 mr-2 w-full @sm:mv-w-auto"
                      preventScrollReset
                    >
                      <input
                        hidden
                        name={`modal-${item.document.id}`}
                        defaultValue="true"
                      />
                      <Button type="submit" variant="outline">
                        {locales.content.current.edit}
                      </Button>
                    </Form>
                    <Modal searchParam={`modal-${item.document.id}`}>
                      <Modal.Title>{locales.content.current.edit}</Modal.Title>
                      <Modal.Section>
                        <RemixFormsForm
                          id={`form-edit-document-${item.document.id}`}
                          method="post"
                          fetcher={editDocumentFetcher}
                          action={`/event/${loaderData.event.slug}/settings/documents/edit-document`}
                          schema={editDocumentSchema}
                          preventScrollReset
                        >
                          {({ Field, Errors }) => (
                            <>
                              <Field
                                name="documentId"
                                hidden
                                value={item.document.id}
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
                                      id="title"
                                      name="title"
                                      label={locales.form.title.label}
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
                                    <TextArea
                                      id="description"
                                      name="description"
                                      label={locales.form.description.label}
                                      defaultValue={
                                        item.document.description || ""
                                      }
                                      maxLength={100}
                                    />
                                    <Errors />
                                  </>
                                )}
                              </Field>
                              <Errors />
                            </>
                          )}
                        </RemixFormsForm>
                      </Modal.Section>
                      <Modal.SubmitButton
                        form={`form-edit-document-${item.document.id}`}
                      >
                        {locales.form.submit.label}
                      </Modal.SubmitButton>
                      <Modal.CloseButton>
                        {locales.form.cancel.label}
                      </Modal.CloseButton>
                    </Modal>
                    <RemixFormsForm
                      method="post"
                      fetcher={deleteDocumentFetcher}
                      action={`/event/${loaderData.event.slug}/settings/documents/delete-document`}
                      schema={deleteDocumentSchema}
                    >
                      {({ Field, Errors }) => (
                        <>
                          <Field
                            name="documentId"
                            hidden
                            value={item.document.id}
                          />
                          <button
                            type="submit"
                            className="btn btn-outline-primary ml-auto btn-small mt-2 w-full @sm:mv-w-auto"
                          >
                            {locales.form.delete.label}
                          </button>
                          <Errors />
                        </>
                      )}
                    </RemixFormsForm>
                  </div>
                </div>
              );
            })}
          </ul>
          <Link
            className="btn btn-outline btn-primary mt-4"
            to={`/event/${loaderData.event.slug}/documents-download`}
            reloadDocument
          >
            {locales.content.downloadAll}
          </Link>
        </div>
      ) : null}

      <RemixFormsForm
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
              {locales.form.upload.label}
            </button>
            <Errors />
          </>
        )}
      </RemixFormsForm>
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
              hiddenFields={["publish"]}
              values={{
                publish: !loaderData.event.published,
              }}
            >
              {(remixFormsProps) => {
                const { Button, Field } = remixFormsProps;
                return (
                  <>
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {loaderData.event.published
                        ? locales.form.hide.label
                        : locales.form.publish.label}
                    </Button>
                  </>
                );
              }}
            </RemixFormsForm>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Documents;
