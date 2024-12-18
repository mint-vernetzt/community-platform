import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import {
  Button,
  Image,
  Input,
  Section,
  Toast,
} from "@mint-vernetzt/components";
import {
  json,
  redirect,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { type TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { Modal } from "~/routes/__components";
import { getPublicURL } from "~/storage.server";
import { BackButton, MaterialList } from "./__components";
import {
  hasValidMimeType,
  storeDocument,
  storeImage,
} from "./attachments.server";
import {
  documentSchema,
  imageSchema,
  type action as EditAction,
} from "./attachments/edit";
import {
  getRedirectPathOnProtectedProjectRoute,
  getHash,
} from "./utils.server";
import { Deep } from "~/lib/utils/searchParams";

const MAX_UPLOAD_SIZE = 6 * 1024 * 1024; // 6MB
const i18nNS = ["routes/project/settings/attachments"];
export const handle = {
  i18n: i18nNS,
};

export function getExtension(filename: string) {
  return filename.substring(filename.lastIndexOf(".") + 1, filename.length);
}

const documentMimeTypes = ["application/pdf", "image/jpeg"];

const createDocumentUploadSchema = (t: TFunction) =>
  z.object({
    filename: z.string().transform((filename) => {
      const extension = getExtension(filename);
      return `${filename
        .replace(`.${extension}`, "")
        .replace(/\W/g, "_")}.${extension}`; // needed for storing on s3
    }),
    document: z
      .instanceof(File)
      .refine((file) => {
        return file.size <= MAX_UPLOAD_SIZE;
      }, t("validation.document.size"))
      .refine((file) => {
        return documentMimeTypes.includes(file.type);
      }, t("validation.document.type")),
  });

const imageMimeTypes = ["image/png", "image/jpeg"];

const createImageUploadSchema = (t: TFunction) =>
  z.object({
    filename: z.string().transform((filename) => {
      const extension = getExtension(filename);
      return `${filename
        .replace(`.${extension}`, "")
        .replace(/\W/g, "_")}.${extension}`; // needed for storing on s3
    }),
    image: z
      .instanceof(File)
      .refine((file) => {
        console.log(typeof file);
        return file.size <= MAX_UPLOAD_SIZE;
      }, t("validation.image.size"))
      .refine((file) => {
        return imageMimeTypes.includes(file.type);
      }, t("validation.image.type")),
  });

const actionSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });

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

  invariantResponse(project !== null, t("error.projectNotFound"), {
    status: 404,
  });

  // project.documents = project.documents.map((relation) => {
  //   if (relation.document.mimeType === "image/jpeg") {
  //     const publicURL = getPublicURL(authClient, relation.document.path);
  //     console.log({ publicURL });
  //     const thumbnail = getImageURL(publicURL, {
  //       resize: { type: "fill", width: 144 },
  //     });
  //     return { ...relation, document: { ...relation.document, thumbnail } };
  //   }
  //   return relation;
  // });
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

  return json({ project: enhancedProject });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const uploadHandler = unstable_composeUploadHandlers(
    unstable_createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE })
  );

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const intent = formData.get(conform.INTENT);

  invariantResponse(
    intent !== null &&
      (intent === "upload_document" ||
        intent === "upload_image" ||
        intent === "delete_document" ||
        intent === "delete_image" ||
        intent === "validate/document" ||
        intent === "validate/image"),
    t("error.invalidAction"),
    {
      status: 400,
    }
  );

  let submission;

  if (intent === "upload_document" || intent === "validate/document") {
    const documentUploadSchema = createDocumentUploadSchema(t);
    submission = parse(formData, {
      schema: documentUploadSchema,
    });

    invariantResponse(
      typeof submission.value !== "undefined" && submission.value !== null,
      t("error.invalidSubmission"),
      { status: 400 }
    );

    if (intent === "validate/document") {
      return json({ status: "idle", submission } as const);
    }

    const mimeTypeIsValid = await hasValidMimeType(
      submission.value.document,
      documentMimeTypes
    );
    invariantResponse(mimeTypeIsValid, t("error.onStoring"), {
      status: 400,
    });

    const filename = submission.value.filename;
    const document = submission.value.document;
    const error = await storeDocument(authClient, {
      slug: params.slug,
      filename,
      document,
    });

    invariantResponse(error === null, t("error.onStoring"), {
      status: 400,
    });
  } else if (intent === "upload_image" || intent === "validate/image") {
    const imageUploadSchema = createImageUploadSchema(t);
    submission = parse(formData, {
      schema: imageUploadSchema,
    });
    invariantResponse(
      typeof submission.value !== "undefined" && submission.value !== null,
      t("error.invalidSubmission"),
      { status: 400 }
    );

    if (intent === "validate/image") {
      return json({ status: "idle", submission } as const);
    }

    const mimeTypeIsValid = await hasValidMimeType(
      submission.value.image,
      imageMimeTypes
    );
    invariantResponse(mimeTypeIsValid, t("error.onStoring"), {
      status: 400,
    });

    const filename = submission.value.filename;
    const image = submission.value.image;

    const error = await storeImage(authClient, {
      slug: params.slug,
      filename,
      image,
    });

    invariantResponse(error === null, t("error.onStoring"), {
      status: 400,
    });
  } else if (intent === "delete_document") {
    submission = parse(formData, {
      schema: actionSchema,
    });

    invariantResponse(
      typeof submission.value !== "undefined" && submission.value !== null,
      t("error.invalidSubmission"),
      { status: 400 }
    );

    const id = submission.value.id;
    await prismaClient.document.delete({
      where: {
        id,
      },
    });
  } else if (intent === "delete_image") {
    submission = parse(formData, {
      schema: actionSchema,
    });

    invariantResponse(
      typeof submission.value !== "undefined" && submission.value !== null,
      t("error.invalidSubmission"),
      { status: 400 }
    );

    const id = submission.value.id;
    await prismaClient.image.delete({
      where: {
        id,
      },
    });
  }

  const submissionHash =
    typeof submission !== "undefined" ? getHash(submission) : null;

  return json({
    status: "success",
    submission,
    hash: submissionHash,
  } as const);
};

function Attachments() {
  const location = useLocation();

  const [documentName, setDocumentName] = React.useState<string | null>(null);
  const [imageName, setImageName] = React.useState<string | null>(null);
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const editFetcher = useFetcher<typeof EditAction>();

  const { t } = useTranslation(i18nNS);

  const documentUploadSchema = createDocumentUploadSchema(t);
  const [documentUploadForm, documentUploadFields] = useForm({
    shouldValidate: "onInput",
    onValidate: (values) => {
      const result = parse(values.formData, { schema: documentUploadSchema });
      return result;
    },
    lastSubmission:
      typeof actionData !== "undefined" ? actionData.submission : undefined,
    shouldRevalidate: "onInput",
  });

  const imageUploadSchema = createImageUploadSchema(t);
  const [imageUploadForm, imageUploadFields] = useForm({
    shouldValidate: "onInput",
    onValidate: (values) => {
      const result = parse(values.formData, { schema: imageUploadSchema });
      return result;
    },
    lastSubmission:
      typeof actionData !== "undefined" ? actionData.submission : undefined,
    shouldRevalidate: "onInput",
  });

  const [editDocumentForm, editDocumentFields] = useForm({
    shouldValidate: "onInput",
    onValidate: (values) => {
      let schema = documentSchema;
      const result = parse(values.formData, { schema });
      return result;
    },
    lastSubmission:
      typeof editFetcher.data !== "undefined"
        ? editFetcher.data.submission
        : undefined,
  });

  const [editImageForm, editImageFields] = useForm({
    shouldValidate: "onInput",
    onValidate: (values) => {
      let schema = imageSchema;
      const result = parse(values.formData, { schema });
      return result;
    },
    lastSubmission:
      typeof editFetcher.data !== "undefined"
        ? editFetcher.data.submission
        : undefined,
  });

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      event.target.files !== null &&
      event.target.files.length > 0 &&
      event.target.files[0] instanceof Blob
    ) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentName(file.name);
      };
      reader.readAsDataURL(file);
    } else {
      setDocumentName(null);
    }
  };
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (
      event.target.files !== null &&
      event.target.files.length > 0 &&
      event.target.files[0] instanceof Blob
    ) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageName(file.name);
      };
      reader.readAsDataURL(file);
    } else {
      setImageName(null);
    }
  };

  // necessary to reset document and image name after successful upload
  React.useEffect(() => {
    if (
      typeof actionData !== "undefined" &&
      actionData !== null &&
      actionData.status === "success" &&
      typeof actionData.submission !== "undefined"
    ) {
      if (actionData.submission.intent === "upload_document") {
        setDocumentName(null);
      }
      if (actionData.submission.intent === "upload_image") {
        setImageName(null);
      }
    }
  }, [actionData]);

  return (
    <Section>
      <BackButton to={location.pathname}>{t("content.back")}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{t("content.description")}</p>
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {t("content.document.upload")}
          </h2>
          <p>{t("content.document.type")}</p>
          {/* TODO: no-JS version */}
          <Form
            method="post"
            encType="multipart/form-data"
            {...documentUploadForm.props}
          >
            <div className="mv-flex mv-flex-col @md:mv-flex-row mv-gap-2">
              <input
                hidden
                {...conform.input(documentUploadFields.filename)}
                defaultValue={documentName !== null ? documentName : ""}
              />
              {/* TODO: component! */}
              <label
                htmlFor={documentUploadFields.document.id}
                className="mv-font-semibold mv-whitespace-nowrap mv-h-10 mv-text-sm mv-text-center mv-px-6 mv-py-2.5 mv-border mv-border-primary mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-rounded-lg mv-cursor-pointer"
              >
                {t("content.document.select")}
                <input
                  id={documentUploadFields.document.id}
                  name={documentUploadFields.document.name}
                  type="file"
                  accept={documentMimeTypes.join(",")}
                  onChange={handleDocumentChange}
                  hidden
                />
              </label>

              <Button
                // TODO: check type issue
                // @ts-ignore
                disabled={
                  typeof window !== "undefined"
                    ? typeof documentUploadFields.document.error !==
                        "undefined" || documentName === null
                    : true
                }
                type="hidden"
                name={conform.INTENT}
                value="upload_document"
              >
                {t("content.document.action")}
              </Button>
            </div>
            <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-4 mv-text-sm mv-font-semibold">
              {typeof documentUploadFields.document.error === "undefined" && (
                <p>
                  {documentName === null
                    ? t("content.document.selection.empty")
                    : t("content.document.selection.selected", {
                        name: documentName,
                      })}
                </p>
              )}
              {typeof documentUploadFields.document.error !== "undefined" && (
                <p className="mv-text-negative-600">
                  {documentUploadFields.document.error}
                </p>
              )}
              {typeof actionData !== "undefined" &&
                actionData !== null &&
                actionData.status === "success" &&
                typeof actionData.submission !== "undefined" &&
                actionData.submission.intent === "upload_document" &&
                typeof actionData.submission.value !== "undefined" &&
                actionData.submission.value !== null && (
                  <Toast key={actionData.hash}>
                    {t("content.document.added", {
                      name: actionData.submission.value.filename,
                    })}
                  </Toast>
                )}
            </div>
          </Form>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <>
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("content.document.current")}
            </h2>
            {loaderData.project.documents.length > 0 ? (
              <>
                <MaterialList>
                  {loaderData.project.documents.map((relation) => {
                    return (
                      <div key={`document-${relation.document.id}`}>
                        <Modal searchParam={`modal-${relation.document.id}`}>
                          <Modal.Title>
                            {t("content.editModal.editDocument")}
                          </Modal.Title>
                          <Modal.Section>
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
                                    {t("content.editModal.title")}
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
                                    {t("content.editModal.description.label")}
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
                          </Modal.Section>
                          <Modal.SubmitButton
                            form={`form-${relation.document.id}`}
                          >
                            {t("content.editModal.submit")}
                          </Modal.SubmitButton>
                          <Modal.CloseButton>
                            {t("content.editModal.reset")}
                          </Modal.CloseButton>
                        </Modal>
                        <MaterialList.Item
                          id={`material-list-item-${relation.document.id}`}
                        >
                          {/* {typeof relation.document.thumbnail !== "undefined" && (
                          <Image
                            src={relation.document.thumbnail}
                            alt={relation.document.description || ""}
                          />
                        )} */}
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
                          <Form
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
                              to={`./attachments/download?type=document&id=${relation.document.id}`}
                              reloadDocument
                            >
                              <MaterialList.Item.Controls.Download />
                            </Link>
                          </Form>
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
                    {t("content.document.downloadAll")}
                  </Button>
                </div>
                {/* <Link to={`./download?type=documents`} reloadDocument>
                  <Button Alle herunterladen
                </Link> */}
              </>
            ) : (
              <p>{t("content.document.empty")}</p>
            )}
            {typeof actionData !== "undefined" &&
              actionData !== null &&
              actionData.status === "success" &&
              typeof actionData.submission !== "undefined" &&
              actionData.submission.intent === "delete_document" &&
              typeof actionData.submission.value !== "undefined" &&
              actionData.submission.value !== null && (
                <Toast key={actionData.hash}>
                  {t("content.document.deleted", {
                    name: actionData.submission.value.filename,
                  })}
                </Toast>
              )}
          </>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {t("content.image.upload")}
          </h2>
          <p>{t("content.image.requirements")}</p>
          {/* TODO: no-JS version */}
          <Form
            method="post"
            encType="multipart/form-data"
            {...imageUploadForm.props}
          >
            <div className="mv-flex mv-flex-col @md:mv-flex-row mv-gap-2">
              <input
                hidden
                {...conform.input(imageUploadFields.filename)}
                defaultValue={imageName !== null ? imageName : ""}
              />
              {/* TODO: component! */}
              <label
                htmlFor={imageUploadFields.image.id}
                className="mv-font-semibold mv-whitespace-nowrap mv-h-10 mv-text-sm mv-text-center mv-px-6 mv-py-2.5 mv-border mv-border-primary mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-rounded-lg mv-cursor-pointer"
              >
                {t("content.image.select")}
                <input
                  id={imageUploadFields.image.id}
                  name={imageUploadFields.image.name}
                  type="file"
                  accept={imageMimeTypes.join(",")}
                  onChange={handleImageChange}
                  hidden
                />
              </label>

              <Button
                // TODO: check type issue
                // @ts-ignore
                disabled={
                  typeof window !== "undefined"
                    ? typeof imageUploadFields.image.error !== "undefined" ||
                      imageName === null
                    : true
                }
                type="hidden"
                name={conform.INTENT}
                value="upload_image"
              >
                {t("content.image.action")}
              </Button>
            </div>
            <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-4 mv-text-sm mv-font-semibold">
              {typeof imageUploadFields.image.error === "undefined" && (
                <p>
                  {imageName === null
                    ? t("content.image.selection.empty")
                    : t("content.image.selection.selected", {
                        name: imageName,
                      })}
                </p>
              )}
              {typeof imageUploadFields.image.error !== "undefined" && (
                <p className="mv-text-negative-600">
                  {imageUploadFields.image.error}
                </p>
              )}
              {typeof actionData !== "undefined" &&
                actionData !== null &&
                actionData.status === "success" &&
                typeof actionData.submission !== "undefined" &&
                actionData.submission.intent === "upload_image" &&
                typeof actionData.submission.value !== "undefined" &&
                actionData.submission.value !== null && (
                  <Toast key={actionData.hash}>
                    {t("content.image.added", {
                      name: actionData.submission.value.filename,
                    })}
                  </Toast>
                )}
            </div>
          </Form>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {t("content.image.current")}
          </h2>
          {loaderData.project.images.length > 0 ? (
            <>
              <MaterialList>
                {loaderData.project.images.map((relation) => {
                  return (
                    <div key={`image-${relation.image.id}`}>
                      <Modal searchParam={`modal-${relation.image.id}`}>
                        <Modal.Title>
                          {t("content.editModal.editImage")}
                        </Modal.Title>
                        <Modal.Section>
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
                                  {t("content.editModal.title")}
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
                                  {t("content.editModal.credits.label")}
                                </Input.Label>
                                <Input.HelperText>
                                  {t("content.editModal.credits.helper")}
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
                                  {t("content.editModal.description.label")}
                                </Input.Label>
                                <Input.HelperText>
                                  {t("content.editModal.description.helper")}
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
                        </Modal.Section>
                        <Modal.SubmitButton form={`form-${relation.image.id}`}>
                          {t("content.editModal.submit")}
                        </Modal.SubmitButton>
                        <Modal.CloseButton>
                          {t("content.editModal.reset")}
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
                        <Form
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
                            to={`./attachments/download?type=image&id=${relation.image.id}`}
                            reloadDocument
                          >
                            <MaterialList.Item.Controls.Download />
                          </Link>
                        </Form>
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
                  {t("content.image.downloadAll")}
                </Button>
              </div>
            </>
          ) : (
            <p>{t("content.image.empty")}</p>
          )}
          {typeof actionData !== "undefined" &&
            actionData !== null &&
            actionData.status === "success" &&
            typeof actionData.submission !== "undefined" &&
            actionData.submission.intent === "delete_image" &&
            typeof actionData.submission.value !== "undefined" &&
            actionData.submission.value !== null && (
              <Toast key={actionData.hash}>
                {t("content.image.deleted", {
                  name: actionData.submission.value.filename,
                })}
              </Toast>
            )}
        </div>
      </div>
    </Section>
  );
}

export default Attachments;
