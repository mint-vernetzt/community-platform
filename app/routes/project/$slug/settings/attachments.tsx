import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import React from "react";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
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
  uploadFile,
  type ProjectAttachmentSettingsLocales,
} from "./attachments.server";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { redirectWithToast } from "~/toast.server";
import * as Sentry from "@sentry/remix";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { INTENT_FIELD_NAME } from "~/form-helpers";

export const createDocumentUploadSchema = (
  locales: ProjectAttachmentSettingsLocales
) => z.object({ ...documentSchema(locales) });

export const createImageUploadSchema = (
  locales: ProjectAttachmentSettingsLocales
) => z.object({ ...imageSchema(locales) });

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
  console.log({ intent });
  if (intent === UPLOAD_INTENT_VALUE) {
    const result = await uploadFile({ request, formData, slug, locales });
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
    return redirect(request.url);
  }
  return redirectWithToast(request.url, toast);
};

function Attachments() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();

  // Document upload form
  const [selectedDocumentFileNames, setSelectedDocumentFileNames] =
    React.useState<SelectedFile[]>([]);
  const [documentUploadForm, documentUploadFields] = useForm({
    id: `upload-document-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    constraint: getZodConstraint(
      createDocumentUploadSchema(loaderData.locales)
    ),
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
        schema: createDocumentUploadSchema(loaderData.locales),
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
    constraint: getZodConstraint(createImageUploadSchema(loaderData.locales)),
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
        schema: createImageUploadSchema(loaderData.locales),
      });
      console.log({ submission });
      return submission;
    },
  });

  React.useEffect(() => {
    setSelectedImageFileNames([]);
  }, [loaderData]);

  // TODO: Implement edit on this routes action
  // const editFetcher = useFetcher<typeof EditAction>();
  // const [editDocumentForm, editDocumentFields] = useForm({
  //   shouldValidate: "onInput",
  //   onValidate: (values) => {
  //     const schema = documentSchema;
  //     const result = parse(values.formData, { schema });
  //     return result;
  //   },
  //   lastSubmission:
  //     typeof editFetcher.data !== "undefined"
  //       ? editFetcher.data.submission
  //       : undefined,
  // });

  // const [editImageForm, editImageFields] = useForm({
  //   shouldValidate: "onInput",
  //   onValidate: (values) => {
  //     const schema = imageSchema;
  //     const result = parse(values.formData, { schema });
  //     return result;
  //   },
  //   lastSubmission:
  //     typeof editFetcher.data !== "undefined"
  //       ? editFetcher.data.submission
  //       : undefined,
  // });

  // TODO: Delete form on this routes action

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
                    return (
                      <div key={`document-${relation.document.id}`}>
                        <Modal searchParam={`modal-${relation.document.id}`}>
                          <Modal.Title>
                            {locales.route.content.editModal.editDocument}
                          </Modal.Title>
                          {/* TODO: edit form on this routes action */}
                          {/* <Modal.Section>
                            <editFetcher.Form
                              {...editDocumentForm.props}
                              method="post"
                              action="./edit"
                              id={`form-${relation.document.id}`}
                              preventScrollReset
                            >
                              <div className="mv-flex mv-flex-col mv-gap-6">
                                <Input
                                  {...conform.input(editDocumentFields.title)}
                                  defaultValue={
                                    relation.document.title || undefined
                                  }
                                >
                                  <Input.Label>
                                    {locales.route.content.editModal.title}
                                  </Input.Label>
                                  {typeof editDocumentFields.title.error !==
                                    "undefined" && (
                                    <Input.Error>
                                      {editDocumentFields.title.error}
                                    </Input.Error>
                                  )}
                                </Input>
                                <Input
                                  {...conform.input(
                                    editDocumentFields.description
                                  )}
                                  defaultValue={
                                    relation.document.description || undefined
                                  }
                                  maxLength={80}
                                >
                                  <Input.Label>
                                    {
                                      locales.route.content.editModal
                                        .description.label
                                    }
                                  </Input.Label>
                                  {typeof editDocumentFields.description
                                    .error !== "undefined" && (
                                    <Input.Error>
                                      {editDocumentFields.description.error}
                                    </Input.Error>
                                  )}
                                </Input>
                                <input
                                  hidden
                                  name="type"
                                  defaultValue="document"
                                />
                                <input
                                  hidden
                                  name="id"
                                  defaultValue={relation.document.id}
                                />
                              </div>
                            </editFetcher.Form>
                          </Modal.Section> */}
                          <Modal.SubmitButton
                            form={`form-${relation.document.id}`}
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
                          {/* TODO: Delete form on this routes action */}
                          {/* <Form
                            method="post"
                            encType="multipart/form-data"
                            className="mv-shrink-0 mv-p-4 mv-flex mv-gap-2 @lg:mv-gap-4 mv-ml-auto"
                          >
                            <input
                              hidden
                              name={conform.INTENT}
                              defaultValue="delete_document"
                            />
                            <input
                              hidden
                              name="id"
                              defaultValue={relation.document.id}
                            />
                            <input
                              hidden
                              name="filename"
                              defaultValue={relation.document.filename}
                            />
                            <MaterialList.Item.Controls.Delete type="submit" />
                            <Link
                              to={`?${Deep}=true&modal-${relation.document.id}=true`}
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
                          </Form> */}
                        </MaterialList.Item>
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
                  return (
                    <div key={`image-${relation.image.id}`}>
                      <Modal searchParam={`modal-${relation.image.id}`}>
                        <Modal.Title>
                          {locales.route.content.editModal.editImage}
                        </Modal.Title>
                        {/* TODO; edit image form on this routes action */}
                        {/* <Modal.Section>
                          <editFetcher.Form
                            {...editImageForm.props}
                            method="post"
                            action="./edit"
                            id={`form-${relation.image.id}`}
                            preventScrollReset
                          >
                            <div className="mv-flex mv-flex-col mv-gap-6">
                              <Input
                                {...conform.input(editImageFields.title)}
                                defaultValue={relation.image.title || undefined}
                              >
                                <Input.Label>
                                  {locales.route.content.editModal.title}
                                </Input.Label>
                                {typeof editImageFields.title.error !==
                                  "undefined" && (
                                  <Input.Error>
                                    {editImageFields.title.error}
                                  </Input.Error>
                                )}
                              </Input>

                              <Input
                                {...conform.input(editImageFields.credits)}
                                defaultValue={
                                  relation.image.credits || undefined
                                }
                                maxLength={80}
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
                                {typeof editImageFields.credits.error !==
                                  "undefined" && (
                                  <Input.Error>
                                    {editImageFields.credits.error}
                                  </Input.Error>
                                )}
                              </Input>

                              <Input
                                {...conform.input(editImageFields.description)}
                                defaultValue={
                                  relation.image.description || undefined
                                }
                                maxLength={80}
                              >
                                <Input.Label>
                                  {
                                    locales.route.content.editModal.description
                                      .label
                                  }
                                </Input.Label>
                                <Input.HelperText>
                                  {
                                    locales.route.content.editModal.description
                                      .helper
                                  }
                                </Input.HelperText>

                                {typeof editImageFields.description.error !==
                                  "undefined" && (
                                  <Input.Error>
                                    {editImageFields.description.error}
                                  </Input.Error>
                                )}
                              </Input>
                              <input hidden name="type" defaultValue="image" />
                              <input
                                hidden
                                name="id"
                                defaultValue={relation.image.id}
                              />
                            </div>
                          </editFetcher.Form>
                        </Modal.Section> */}
                        <Modal.SubmitButton form={`form-${relation.image.id}`}>
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
                        {/* TODO: Delete image form on this routes action */}
                        {/* <Form
                          method="post"
                          encType="multipart/form-data"
                          className="mv-shrink-0 mv-p-4 mv-flex mv-gap-2 @lg:mv-gap-4 mv-ml-auto"
                        >
                          <input
                            hidden
                            name={conform.INTENT}
                            defaultValue="delete_image"
                          />
                          <input
                            hidden
                            name="id"
                            defaultValue={relation.image.id}
                          />
                          <input
                            hidden
                            name="filename"
                            defaultValue={relation.image.filename}
                          />
                          <MaterialList.Item.Controls.Delete type="submit" />
                          <Link
                            to={`?${Deep}=true&modal-${relation.image.id}=true`}
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
                        </Form> */}
                      </MaterialList.Item>
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
