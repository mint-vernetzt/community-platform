import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import React from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BackButton } from "~/components-next/BackButton";
import { FileInput, type SelectedFile } from "~/components-next/FileInput";
import { MaterialList } from "~/components-next/MaterialList";
import { Modal } from "~/components-next/Modal";
import { detectLanguage } from "~/i18n.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL, parseMultipartFormData } from "~/storage.server";
import {
  BUCKET_FIELD_NAME,
  BUCKET_NAME_DOCUMENTS,
  BUCKET_NAME_IMAGES,
  DOCUMENT_MIME_TYPES,
  documentSchema,
  FILE_FIELD_NAME,
  IMAGE_MIME_TYPES,
  imageSchema,
  UPLOAD_INTENT_VALUE,
} from "~/storage.shared";
import {
  disconnectDocument,
  disconnectImage,
  editDocument,
  editImage,
  uploadFile,
  type ProjectAttachmentSettingsLocales,
} from "./attachments.server";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { redirectWithToast } from "~/toast.server";
import * as Sentry from "@sentry/remix";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";

export const createDocumentUploadSchema = (
  locales: ProjectAttachmentSettingsLocales
) => z.object({ ...documentSchema(locales) });

export const createImageUploadSchema = (
  locales: ProjectAttachmentSettingsLocales
) => z.object({ ...imageSchema(locales) });

const DOCUMENT_DESCRIPTION_MAX_LENGTH = 80;

export const createEditDocumentSchema = (
  locales: ProjectAttachmentSettingsLocales
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

const IMAGE_DESCRIPTION_MAX_LENGTH = 80;
const IMAGE_CREDITS_MAX_LENGTH = 80;

export const createEditImageSchema = (
  locales: ProjectAttachmentSettingsLocales
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
        IMAGE_DESCRIPTION_MAX_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.document.description.max,
          {
            max: IMAGE_DESCRIPTION_MAX_LENGTH,
          }
        )
      )
      .optional()
      .transform((value) =>
        typeof value === "undefined" || value === "" ? null : value
      ),
    credits: z
      .string()
      .max(
        IMAGE_CREDITS_MAX_LENGTH,
        insertParametersIntoLocale(locales.route.validation.image.credits.max, {
          max: IMAGE_CREDITS_MAX_LENGTH,
        })
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
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/attachments"];

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invalidRoute,
    {
      status: 400,
    }
  );

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const project = await prismaClient.project.findFirst({
    where: {
      slug: params.slug,
    },
    select: {
      documents: {
        select: {
          document: {
            select: {
              id: true,
              title: true,
              path: true,
              filename: true,
              mimeType: true,
              sizeInMB: true,
              description: true,
              extension: true,
            },
          },
        },
      },
      images: {
        select: {
          image: {
            select: {
              id: true,
              title: true,
              path: true,
              filename: true,
              credits: true,
              sizeInMB: true,
              description: true,
              extension: true,
            },
          },
        },
      },
    },
  });

  invariantResponse(project !== null, locales.route.error.projectNotFound, {
    status: 404,
  });
  const images = project.images.map((relation) => {
    const publicURL = getPublicURL(authClient, relation.image.path);
    const thumbnail = getImageURL(publicURL, {
      resize: { type: "fill", ...ImageSizes.Project.Detail.MaterialThumbnail },
    });
    const blurredThumbnail = getImageURL(publicURL, {
      resize: {
        type: "fill",
        ...ImageSizes.Project.Detail.BlurredMaterialThumbnail,
      },
      blur: BlurFactor,
    });
    return {
      ...relation,
      image: { ...relation.image, thumbnail, blurredThumbnail },
    };
  });

  const enhancedProject = {
    ...project,
    images,
  };

  return { project: enhancedProject, locales, currentTimestamp: Date.now() };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/attachments"];

  const { formData, error } = await parseMultipartFormData(request);
  if (error !== null || formData === null) {
    console.error({ error });
    Sentry.captureException(error);
    // TODO: How can we add this to the zod ctx?
    return redirectWithToast(request.url, {
      id: "upload-document",
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
    const result = await uploadFile({ request, formData, slug, locales });
    submission = result.submission;
    toast = result.toast;
  } else if (intent === "edit-document") {
    const result = await editDocument({ request, formData, locales });
    submission = result.submission;
    toast = result.toast;
    redirectUrl = result.redirectUrl || request.url;
  } else if (intent === "edit-image") {
    const result = await editImage({ request, formData, locales });
    submission = result.submission;
    toast = result.toast;
    redirectUrl = result.redirectUrl || request.url;
  } else if (intent === "disconnect-document") {
    const result = await disconnectDocument({ formData, locales });
    submission = result.submission;
    toast = result.toast;
  } else if (intent === "disconnect-image") {
    const result = await disconnectImage({ formData, locales });
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

function Attachments() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const [searchParams] = useSearchParams();

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

  // Image upload form
  const [selectedImageFileNames, setSelectedImageFileNames] = React.useState<
    SelectedFile[]
  >([]);
  const [imageUploadForm, imageUploadFields] = useForm({
    id: `upload-image-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    constraint: getZodConstraint(createImageUploadSchema(locales)),
    defaultValue: {
      [FILE_FIELD_NAME]: null,
      [BUCKET_FIELD_NAME]: BUCKET_NAME_IMAGES,
      [INTENT_FIELD_NAME]: UPLOAD_INTENT_VALUE,
    },
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: createImageUploadSchema(locales),
      });
      return submission;
    },
  });
  React.useEffect(() => {
    setSelectedImageFileNames([]);
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

  // Edit image form
  const [editImageForm, editImageFields] = useForm({
    id: `edit-image-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    constraint: getZodConstraint(createEditImageSchema(locales)),
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: createEditImageSchema(locales),
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

  // Disconnect image form
  // eslint ignore is intended
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_disconnectImageForm, disconnectImageFields] = useForm({
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
    <Section>
      <BackButton to={location.pathname}>
        {locales.route.content.back}
      </BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.description}</p>
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {locales.route.content.document.upload}
          </h2>
          <p>{locales.route.content.document.type}</p>
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
              <FileInput.Text>
                {locales.route.content.document.select}
              </FileInput.Text>
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
            {loaderData.project.documents.length > 0 ? (
              <>
                <MaterialList>
                  {loaderData.project.documents.map((relation) => {
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
                          {relation.document.mimeType === "image/jpeg" && (
                            <MaterialList.Item.JPGIcon />
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
                              to={`./download?type=document&id=${relation.document.id}`}
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
                    href={`./attachments/download?type=documents`}
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
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {locales.route.content.image.upload}
          </h2>
          <p>{locales.route.content.image.requirements}</p>
          <Form
            {...getFormProps(imageUploadForm)}
            method="post"
            encType="multipart/form-data"
            preventScrollReset
          >
            <FileInput
              selectedFileNames={selectedImageFileNames}
              errors={
                typeof imageUploadFields[FILE_FIELD_NAME].errors === "undefined"
                  ? undefined
                  : imageUploadFields[FILE_FIELD_NAME].errors.map((error) => {
                      return {
                        id: imageUploadFields[FILE_FIELD_NAME].errorId,
                        message: error,
                      };
                    })
              }
              fileInputProps={{
                ...getInputProps(imageUploadFields[FILE_FIELD_NAME], {
                  type: "file",
                }),
                id: `image-${FILE_FIELD_NAME}`,
                key: `image-${FILE_FIELD_NAME}`,
                className: "mv-hidden",
                accept: IMAGE_MIME_TYPES.join(", "),
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  setSelectedImageFileNames(
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
                  imageUploadForm.validate();
                },
              }}
              bucketInputProps={{
                ...getInputProps(imageUploadFields[BUCKET_FIELD_NAME], {
                  type: "hidden",
                }),
                key: BUCKET_FIELD_NAME,
              }}
              noscriptInputProps={{
                ...getInputProps(imageUploadFields[FILE_FIELD_NAME], {
                  type: "file",
                }),
                id: `noscript-image-${FILE_FIELD_NAME}`,
                key: `noscript-image-${FILE_FIELD_NAME}`,
                className: "mv-mb-2",
                accept: IMAGE_MIME_TYPES.join(", "),
              }}
            >
              <FileInput.Text>
                {locales.route.content.image.select}
              </FileInput.Text>
              <FileInput.Controls>
                <input
                  {...getInputProps(imageUploadFields[INTENT_FIELD_NAME], {
                    type: "hidden",
                  })}
                  key={`image-${UPLOAD_INTENT_VALUE}`}
                />
                <Button
                  type="submit"
                  fullSize
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? selectedImageFileNames.length === 0 ||
                        imageUploadForm.dirty === false ||
                        imageUploadForm.valid === false
                      : false
                  }
                >
                  {locales.route.content.image.action}
                </Button>
              </FileInput.Controls>
            </FileInput>
          </Form>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {locales.route.content.image.current}
          </h2>
          {loaderData.project.images.length > 0 ? (
            <>
              <MaterialList>
                {loaderData.project.images.map((relation) => {
                  const editSearchParams = new URLSearchParams(searchParams);
                  editSearchParams.set(
                    `modal-edit-${relation.image.id}`,
                    "true"
                  );
                  return (
                    <div key={`image-${relation.image.id}`}>
                      <Modal searchParam={`modal-edit-${relation.image.id}`}>
                        <Modal.Title>
                          {locales.route.content.editModal.editImage}
                        </Modal.Title>
                        <Modal.Section>
                          <Form
                            {...getFormProps(editImageForm)}
                            method="post"
                            preventScrollReset
                            autoComplete="off"
                          >
                            <div className="mv-flex mv-flex-col mv-gap-6">
                              <Input
                                {...getInputProps(editImageFields.title, {
                                  type: "text",
                                })}
                                key={`edit-image-title-${relation.image.id}`}
                                defaultValue={relation.image.title || undefined}
                              >
                                <Input.Label>
                                  {locales.route.content.editModal.title}
                                </Input.Label>
                                {typeof editImageFields.title.errors !==
                                  "undefined" && (
                                  <Input.Error>
                                    {editImageFields.title.errors}
                                  </Input.Error>
                                )}
                              </Input>
                              <Input
                                {...getInputProps(editImageFields.credits, {
                                  type: "text",
                                })}
                                key={`edit-image-credits-${relation.image.id}`}
                                defaultValue={
                                  relation.image.credits || undefined
                                }
                                maxLength={IMAGE_CREDITS_MAX_LENGTH}
                              >
                                <Input.Label>
                                  {
                                    locales.route.content.editModal.credits
                                      .label
                                  }
                                </Input.Label>
                                <Input.HelperText>
                                  {
                                    locales.route.content.editModal.credits
                                      .helper
                                  }
                                </Input.HelperText>
                                {typeof editImageFields.credits.errors !==
                                  "undefined" && (
                                  <Input.Error>
                                    {editImageFields.credits.errors}
                                  </Input.Error>
                                )}
                              </Input>
                              <Input
                                {...getInputProps(editImageFields.description, {
                                  type: "text",
                                })}
                                key={`edit-image-description-${relation.image.id}`}
                                defaultValue={
                                  relation.image.description || undefined
                                }
                                maxLength={IMAGE_DESCRIPTION_MAX_LENGTH}
                              >
                                <Input.Label>
                                  {
                                    locales.route.content.editModal.description
                                      .label
                                  }
                                </Input.Label>
                                {typeof editImageFields.description.errors !==
                                  "undefined" && (
                                  <Input.Error>
                                    {editImageFields.description.errors}
                                  </Input.Error>
                                )}
                              </Input>
                              <input
                                {...getInputProps(editImageFields.id, {
                                  type: "hidden",
                                })}
                                key={`edit-image-id-${relation.image.id}`}
                                defaultValue={relation.image.id}
                              />
                            </div>
                          </Form>
                        </Modal.Section>
                        <Modal.SubmitButton
                          type="submit"
                          name={INTENT_FIELD_NAME}
                          value="edit-image"
                          form={editImageForm.id}
                        >
                          {locales.route.content.editModal.submit}
                        </Modal.SubmitButton>
                        <Modal.CloseButton>
                          {locales.route.content.editModal.reset}
                        </Modal.CloseButton>
                      </Modal>
                      <MaterialList.Item
                        id={`material-list-image-item-${relation.image.id}`}
                      >
                        <Image
                          src={relation.image.thumbnail}
                          blurredSrc={relation.image.blurredThumbnail}
                          alt={relation.image.description || ""}
                        />
                        <MaterialList.Item.Title>
                          {relation.image.title !== null
                            ? relation.image.title
                            : relation.image.filename}
                        </MaterialList.Item.Title>
                        <MaterialList.Item.Meta>
                          ({relation.image.extension}, {relation.image.sizeInMB}{" "}
                          MB)
                        </MaterialList.Item.Meta>
                        {relation.image.description !== null && (
                          <MaterialList.Item.Paragraph>
                            {relation.image.description}
                          </MaterialList.Item.Paragraph>
                        )}
                        {relation.image.credits !== null && (
                          <MaterialList.Item.Paragraph>
                            Foto-Credit: {relation.image.credits}
                          </MaterialList.Item.Paragraph>
                        )}
                        <div className="mv-shrink-0 mv-p-4 mv-flex mv-gap-2 @lg:mv-gap-4 mv-ml-auto">
                          <Form
                            id={`disconnect-image-form-${relation.image.id}`}
                            method="post"
                            preventScrollReset
                            autoComplete="off"
                            hidden
                          >
                            <input
                              id={`disconnect-image-form-${relation.image.id}-id`}
                              type="hidden"
                              name="id"
                              key={`disconnect-image-id-${relation.image.id}`}
                              defaultValue={relation.image.id}
                              aria-invalid={
                                typeof disconnectImageFields.id.errors !==
                                "undefined"
                              }
                              aria-describedby={`disconnect-image-form-${relation.image.id}-id-error`}
                            />
                          </Form>
                          <MaterialList.Item.Controls.Delete
                            type="submit"
                            name={INTENT_FIELD_NAME}
                            value="disconnect-image"
                            form={`disconnect-image-form-${relation.image.id}`}
                          />
                          <Link
                            to={`?${editSearchParams.toString()}`}
                            preventScrollReset
                          >
                            <MaterialList.Item.Controls.Edit />
                          </Link>
                          <Link
                            to={`./download?type=image&id=${relation.image.id}`}
                            reloadDocument
                          >
                            <MaterialList.Item.Controls.Download />
                          </Link>
                        </div>
                      </MaterialList.Item>
                      {typeof disconnectImageFields.id.errors !==
                        "undefined" && (
                        <Input.Error
                          id={`disconnect-image-form-${relation.image.id}-id-error`}
                        >
                          {disconnectImageFields.id.errors}
                        </Input.Error>
                      )}
                    </div>
                  );
                })}
              </MaterialList>
              <div className="mv-w-full @md:mv-max-w-fit">
                {/* TODO: Button as wrapper for Link (better relative path) */}
                <Button
                  as="a"
                  href={`./attachments/download?type=images`}
                  variant="outline"
                  fullSize
                >
                  {locales.route.content.image.downloadAll}
                </Button>
              </div>
            </>
          ) : (
            <p>{locales.route.content.image.empty}</p>
          )}
        </div>
      </div>
    </Section>
  );
}

export default Attachments;
