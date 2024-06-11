import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import { useState } from "react";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import { Modal } from "~/routes/__components";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "../../utils.server";
import { getEventBySlug } from "./documents.server";
import {
  type action as deleteDocumentAction,
  deleteDocumentSchema,
} from "./documents/delete-document";
import {
  type action as editDocumentAction,
  editDocumentSchema,
} from "./documents/edit-document";
import {
  type action as uploadDocumentAction,
  uploadDocumentSchema,
} from "./documents/upload-document";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";
import { publishSchema, type action as publishAction } from "./events/publish";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { Button } from "@mint-vernetzt/components";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/event/settings/documents",
  ]);
  const { authClient } = createAuthClient(request);

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlug(slug);
  invariantResponse(event, t("error.notFound"), { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  return json({
    event: event,
  });
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
  const { slug } = useParams();

  const uploadDocumentFetcher = useFetcher<typeof uploadDocumentAction>();
  const editDocumentFetcher = useFetcher<typeof editDocumentAction>();
  const deleteDocumentFetcher = useFetcher<typeof deleteDocumentAction>();
  const publishFetcher = useFetcher<typeof publishAction>();

  const { t } = useTranslation(["routes/event/settings/documents"]);

  const [fileSelected, setFileSelected] = useState(false);
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files[0].size > 5_000_000) {
        alert(t("error.fileTooBig"));
        clearFileInput();
        setFileSelected(false);
      } else {
        setFileSelected(true);
      }
    }
  };

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      {loaderData.event.documents.length > 0 ? (
        <div className="mb-8">
          <h3>{t("content.current.headline")}</h3>
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
                      {t("content.current.download")}
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
                        {t("content.current.edit")}
                      </Button>
                    </Form>
                    <Modal searchParam={`modal-${item.document.id}`}>
                      <Modal.Title>{t("content.current.edit")}</Modal.Title>
                      <Modal.Section>
                        <RemixFormsForm
                          id={`form-edit-document-${item.document.id}`}
                          method="post"
                          fetcher={editDocumentFetcher}
                          action={`/event/${loaderData.event.slug}/settings/documents/edit-document`}
                          schema={editDocumentSchema}
                          preventScrollReset
                        >
                          {({ Field, Errors, register }) => (
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
                                      {...register("title")}
                                      id="title"
                                      label={t("form.title.label")}
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
                                      label={t("form.description.label")}
                                      defaultValue={
                                        item.document.description || ""
                                      }
                                      maxCharacters={100}
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
                        {t("form.submit.label")}
                      </Modal.SubmitButton>
                      <Modal.CloseButton>
                        {t("form.cancel.label")}
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
                            {t("form.delete.label")}
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
            {t("content.downloadAll")}
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
              {t("form.upload.label")}
            </button>
            <Errors />
          </>
        )}
      </RemixFormsForm>
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0 pb-24 @md:mv-pb-0">
        <div className="mv-container-custom">
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
              {(props) => {
                const { Button, Field } = props;
                return (
                  <>
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {loaderData.event.published
                        ? t("form.hide.label")
                        : t("form.publish.label")}
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
