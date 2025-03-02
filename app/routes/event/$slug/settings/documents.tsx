import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import * as Sentry from "@sentry/remix";
import React from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useParams,
  useSearchParams,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { FileInput, type SelectedFile } from "~/components-next/FileInput";
import { MaterialList } from "~/components-next/MaterialList";
import { Modal } from "~/components-next/Modal";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { parseMultipartFormData } from "~/storage.server";
import {
  BUCKET_FIELD_NAME,
  BUCKET_NAME_DOCUMENTS,
  DOCUMENT_MIME_TYPES,
  documentSchema,
  FILE_FIELD_NAME,
  MAX_UPLOAD_FILE_SIZE,
  UPLOAD_INTENT_VALUE,
} from "~/storage.shared";
import { redirectWithToast } from "~/toast.server";
import {
  disconnectDocument,
  editDocument,
  getEventBySlug,
  uploadFile,
  type EventDocumentsSettingsLocales,
} from "./documents.server";
import { publishSchema, type action as publishAction } from "./events/publish";
import { getRedirectPathOnProtectedEventRoute } from "./utils.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

export const createDocumentUploadSchema = (
  locales: EventDocumentsSettingsLocales
) => z.object({ ...documentSchema(locales) });

const DOCUMENT_DESCRIPTION_MAX_LENGTH = 80;

export const createEditDocumentSchema = (
  locales: EventDocumentsSettingsLocales
) =>
  z.object({
    id: z.string(),
    title: z
      .string()
      .optional()
      .transform((value) =>
        typeof value === "undefined" || value === "" ? null : value
      ),
    description: z
      .string()
      .max(
        DOCUMENT_DESCRIPTION_MAX_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.document.description.max,
          {
            max: DOCUMENT_DESCRIPTION_MAX_LENGTH,
          }
        )
      )
      .optional()
      .transform((value) =>
        typeof value === "undefined" || value === "" ? null : value
      ),
  });

export const disconnectAttachmentSchema = z.object({
  id: z.string(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);

  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings/documents"];
  const event = await getEventBySlug(slug);
  invariantResponse(event, locales.route.error.eventNotFound, { status: 404 });

  return {
    event: event,
    locales,
    currentTimestamp: Date.now(),
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  // TODO: Above function should assert the session user is not null to avoid below check that has already been done
  invariantResponse(sessionUser !== null, "Forbidden", { status: 403 });
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings/documents"];

  const { formData, error } = await parseMultipartFormData(request);
  if (error !== null || formData === null) {
    console.error({ error });
    Sentry.captureException(error);
    // TODO: How can we add this to the zod ctx?
    return redirectWithToast(request.url, {
      id: "upload-failed",
      key: `${new Date().getTime()}`,
      message: locales.route.error.onStoring,
      level: "negative",
    });
  }

  const intent = formData.get(INTENT_FIELD_NAME);
  let submission;
  let toast;
  let redirectUrl: string | null = request.url;

  if (intent === UPLOAD_INTENT_VALUE) {
    const result = await uploadFile({
      formData,
      authClient,
      slug,
      locales,
    });
    submission = result.submission;
    toast = result.toast;
  } else if (intent === "edit-document") {
    const result = await editDocument({ request, formData, locales });
    submission = result.submission;
    toast = result.toast;
    redirectUrl = result.redirectUrl || request.url;
  } else if (intent === "disconnect-document") {
    const result = await disconnectDocument({ formData, locales });
    submission = result.submission;
    toast = result.toast;
  } else {
    // TODO: How can we add this to the zod ctx?
    return redirectWithToast(request.url, {
      id: "invalid-action",
      key: `${new Date().getTime()}`,
      message: locales.route.error.invalidAction,
      level: "negative",
    });
  }

  if (submission !== null) {
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
  }
  if (toast === null) {
    return redirect(redirectUrl);
  }
  return redirectWithToast(redirectUrl, toast);
};

function Documents() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const { slug } = useParams();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const [searchParams] = useSearchParams();
  const publishFetcher = useFetcher<typeof publishAction>();

  // Document upload form
  const [selectedDocumentFileNames, setSelectedDocumentFileNames] =
    React.useState<SelectedFile[]>([]);
  const [documentUploadForm, documentUploadFields] = useForm({
    id: `upload-document-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    constraint: getZodConstraint(createDocumentUploadSchema(locales)),
    defaultValue: {
      [FILE_FIELD_NAME]: null,
      [BUCKET_FIELD_NAME]: BUCKET_NAME_DOCUMENTS,
      [INTENT_FIELD_NAME]: UPLOAD_INTENT_VALUE,
    },
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: createDocumentUploadSchema(locales),
      });
      return submission;
    },
  });
  React.useEffect(() => {
    setSelectedDocumentFileNames([]);
  }, [loaderData]);

  // Edit document form
  const [editDocumentForm, editDocumentFields] = useForm({
    id: `edit-document-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    constraint: getZodConstraint(createEditDocumentSchema(locales)),
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: createEditDocumentSchema(locales),
      });
      return submission;
    },
  });

  // Disconnect document form
  // eslint ignore is intended
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_disconnectDocumentForm, disconnectDocumentFields] = useForm({
    constraint: getZodConstraint(disconnectAttachmentSchema),
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: disconnectAttachmentSchema,
      });
      return submission;
    },
  });

  return (
    <>
      <h1 className="mb-8">{locales.route.content.headline}</h1>
      <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.description}</p>
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {locales.route.content.document.upload}
          </h2>
          <p>
            {insertParametersIntoLocale(locales.route.content.document.type, {
              max: MAX_UPLOAD_FILE_SIZE / 1000 / 1000,
            })}
          </p>
          <Form
            {...getFormProps(documentUploadForm)}
            method="post"
            encType="multipart/form-data"
            preventScrollReset
          >
            <FileInput
              selectedFileNames={selectedDocumentFileNames}
              errors={
                typeof documentUploadFields[FILE_FIELD_NAME].errors ===
                "undefined"
                  ? undefined
                  : documentUploadFields[FILE_FIELD_NAME].errors.map(
                      (error) => {
                        return {
                          id: documentUploadFields[FILE_FIELD_NAME].errorId,
                          message: error,
                        };
                      }
                    )
              }
              locales={locales}
              fileInputProps={{
                ...getInputProps(documentUploadFields[FILE_FIELD_NAME], {
                  type: "file",
                }),
                id: `document-${FILE_FIELD_NAME}`,
                key: `document-${FILE_FIELD_NAME}`,
                className: "mv-hidden",
                accept: DOCUMENT_MIME_TYPES.join(", "),
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  setSelectedDocumentFileNames(
                    event.target.files !== null
                      ? Array.from(event.target.files).map((file) => {
                          return {
                            name: file.name,
                            sizeInMB:
                              Math.round((file.size / 1000 / 1000) * 100) / 100,
                          };
                        })
                      : []
                  );
                  documentUploadForm.validate();
                },
              }}
              bucketInputProps={{
                ...getInputProps(documentUploadFields[BUCKET_FIELD_NAME], {
                  type: "hidden",
                }),
                key: BUCKET_FIELD_NAME,
              }}
              noscriptInputProps={{
                ...getInputProps(documentUploadFields[FILE_FIELD_NAME], {
                  type: "file",
                }),
                id: `noscript-document-${FILE_FIELD_NAME}`,
                key: `noscript-document-${FILE_FIELD_NAME}`,
                className: "mv-mb-2",
                accept: DOCUMENT_MIME_TYPES.join(", "),
              }}
            >
              <FileInput.Text>{locales.upload.selection.select}</FileInput.Text>
              <FileInput.Controls>
                <input
                  {...getInputProps(documentUploadFields[INTENT_FIELD_NAME], {
                    type: "hidden",
                  })}
                  key={`document-${UPLOAD_INTENT_VALUE}`}
                />
                <Button
                  type="submit"
                  fullSize
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? selectedDocumentFileNames.length === 0 ||
                        documentUploadForm.dirty === false ||
                        documentUploadForm.valid === false
                      : false
                  }
                >
                  {locales.route.content.document.action}
                </Button>
              </FileInput.Controls>
            </FileInput>
          </Form>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <>
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.content.document.current}
            </h2>
            {loaderData.event.documents.length > 0 ? (
              <>
                <MaterialList>
                  {loaderData.event.documents.map((relation) => {
                    const editSearchParams = new URLSearchParams(searchParams);
                    editSearchParams.set(
                      `modal-edit-${relation.document.id}`,
                      "true"
                    );
                    return (
                      <div key={`document-${relation.document.id}`}>
                        <Modal
                          searchParam={`modal-edit-${relation.document.id}`}
                        >
                          <Modal.Title>
                            {locales.route.content.editModal.editDocument}
                          </Modal.Title>
                          <Modal.Section>
                            <Form
                              {...getFormProps(editDocumentForm)}
                              method="post"
                              preventScrollReset
                              autoComplete="off"
                            >
                              <div className="mv-flex mv-flex-col mv-gap-6">
                                <Input
                                  {...getInputProps(editDocumentFields.title, {
                                    type: "text",
                                  })}
                                  key={`edit-document-title-${relation.document.id}`}
                                  defaultValue={
                                    relation.document.title || undefined
                                  }
                                >
                                  <Input.Label>
                                    {locales.route.content.editModal.title}
                                  </Input.Label>
                                  {typeof editDocumentFields.title.errors !==
                                    "undefined" && (
                                    <Input.Error>
                                      {editDocumentFields.title.errors}
                                    </Input.Error>
                                  )}
                                </Input>
                                <Input
                                  {...getInputProps(
                                    editDocumentFields.description,
                                    {
                                      type: "text",
                                    }
                                  )}
                                  key={`edit-document-description-${relation.document.id}`}
                                  defaultValue={
                                    relation.document.description || undefined
                                  }
                                  maxLength={DOCUMENT_DESCRIPTION_MAX_LENGTH}
                                >
                                  <Input.Label>
                                    {
                                      locales.route.content.editModal
                                        .description.label
                                    }
                                  </Input.Label>
                                  {typeof editDocumentFields.description
                                    .errors !== "undefined" && (
                                    <Input.Error>
                                      {editDocumentFields.description.errors}
                                    </Input.Error>
                                  )}
                                </Input>
                                <input
                                  {...getInputProps(editDocumentFields.id, {
                                    type: "hidden",
                                  })}
                                  key={`edit-document-id-${relation.document.id}`}
                                  defaultValue={relation.document.id}
                                />
                              </div>
                            </Form>
                          </Modal.Section>
                          <Modal.SubmitButton
                            type="submit"
                            name={INTENT_FIELD_NAME}
                            value="edit-document"
                            form={editDocumentForm.id}
                          >
                            {locales.route.content.editModal.submit}
                          </Modal.SubmitButton>
                          <Modal.CloseButton>
                            {locales.route.content.editModal.reset}
                          </Modal.CloseButton>
                        </Modal>
                        <MaterialList.Item
                          id={`material-list-item-${relation.document.id}`}
                        >
                          {relation.document.mimeType === "application/pdf" && (
                            <MaterialList.Item.PDFIcon />
                          )}
                          <MaterialList.Item.Title>
                            {relation.document.title !== null
                              ? relation.document.title
                              : relation.document.filename}
                          </MaterialList.Item.Title>
                          <MaterialList.Item.Meta>
                            ({relation.document.extension},{" "}
                            {relation.document.sizeInMB} MB)
                          </MaterialList.Item.Meta>
                          {relation.document.description !== null && (
                            <MaterialList.Item.Paragraph>
                              {relation.document.description}
                            </MaterialList.Item.Paragraph>
                          )}
                          <div className="mv-shrink-0 mv-p-4 mv-flex mv-gap-2 @lg:mv-gap-4 mv-ml-auto">
                            <Form
                              id={`disconnect-document-form-${relation.document.id}`}
                              method="post"
                              preventScrollReset
                              autoComplete="off"
                              hidden
                            >
                              <input
                                id={`disconnect-document-form-${relation.document.id}-id`}
                                type="hidden"
                                name="id"
                                key={`disconnect-document-id-${relation.document.id}`}
                                defaultValue={relation.document.id}
                                aria-invalid={
                                  typeof disconnectDocumentFields.id.errors !==
                                  "undefined"
                                }
                                aria-describedby={`disconnect-document-form-${relation.document.id}-id-error`}
                              />
                            </Form>
                            <MaterialList.Item.Controls.Delete
                              type="submit"
                              name={INTENT_FIELD_NAME}
                              value="disconnect-document"
                              form={`disconnect-document-form-${relation.document.id}`}
                            />
                            <Link
                              to={`?${editSearchParams.toString()}`}
                              preventScrollReset
                            >
                              <MaterialList.Item.Controls.Edit />
                            </Link>
                            <Link
                              to={`/event/${loaderData.event.slug}/documents-download?document_id=${relation.document.id}`}
                              reloadDocument
                            >
                              <MaterialList.Item.Controls.Download />
                            </Link>
                          </div>
                        </MaterialList.Item>
                        {typeof disconnectDocumentFields.id.errors !==
                          "undefined" && (
                          <Input.Error
                            id={`disconnect-document-form-${relation.document.id}-id-error`}
                          >
                            {editDocumentFields.id.errors}
                          </Input.Error>
                        )}
                      </div>
                    );
                  })}
                </MaterialList>
                <div className="mv-w-full @md:mv-max-w-fit">
                  <Button
                    as="a"
                    href={`/event/${loaderData.event.slug}/documents-download`}
                    variant="outline"
                    fullSize
                  >
                    {locales.route.content.document.downloadAll}
                  </Button>
                </div>
              </>
            ) : (
              <p>{locales.route.content.document.empty}</p>
            )}
          </>
        </div>
      </div>
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
                        ? locales.route.content.form.hide.label
                        : locales.route.content.form.publish.label}
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
