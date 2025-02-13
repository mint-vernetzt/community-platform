import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  Link,
  // useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
} from "react-router";
import React from "react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import { Modal } from "~/components-next/Modal";
import { getPublicURL } from "~/storage.server";
import { BackButton } from "~/components-next/BackButton";
import { MaterialList } from "~/components-next/MaterialList";
import {
  // hasValidMimeType,
  type ProjectAttachmentSettingsLocales,
  // storeDocument,
  // storeImage,
} from "./attachments.server";
import {
  documentSchema,
  imageSchema,
  type action as EditAction,
} from "./attachments/edit";
import {
  getRedirectPathOnProtectedProjectRoute,
  // getHash,
} from "./utils.server";
import { Deep } from "~/lib/utils/searchParams";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
// import { redirectWithToast } from "~/toast.server";

// const MAX_UPLOAD_SIZE = 6 * 1024 * 1024; // 6MB

// export function getExtension(filename: string) {
//   return filename.substring(filename.lastIndexOf(".") + 1, filename.length);
// }

// const documentMimeTypes = ["application/pdf", "image/jpeg"];

// const createDocumentUploadSchema = (
//   locales: ProjectAttachmentSettingsLocales
// ) =>
//   z.object({
//     filename: z.string().transform((filename) => {
//       const extension = getExtension(filename);
//       return `${filename
//         .replace(`.${extension}`, "")
//         .replace(/\W/g, "_")}.${extension}`; // needed for storing on s3
//     }),
//     document: z
//       .instanceof(File)
//       .refine((file) => {
//         return file.size <= MAX_UPLOAD_SIZE;
//       }, locales.route.validation.document.size)
//       .refine((file) => {
//         return documentMimeTypes.includes(file.type);
//       }, locales.route.validation.document.type),
//   });

// const imageMimeTypes = ["image/png", "image/jpeg"];

// const createImageUploadSchema = (locales: ProjectAttachmentSettingsLocales) =>
//   z.object({
//     filename: z.string().transform((filename) => {
//       const extension = getExtension(filename);
//       return `${filename
//         .replace(`.${extension}`, "")
//         .replace(/\W/g, "_")}.${extension}`; // needed for storing on s3
//     }),
//     image: z
//       .instanceof(File)
//       .refine((file) => {
//         return file.size <= MAX_UPLOAD_SIZE;
//       }, locales.route.validation.image.size)
//       .refine((file) => {
//         return imageMimeTypes.includes(file.type);
//       }, locales.route.validation.image.type),
//   });

// const actionSchema = z.object({
//   id: z.string().uuid(),
//   filename: z.string(),
// });

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

  return { project: enhancedProject, locales };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  // TODO: Reimplement upload handling (multipart form data parsing) -> poc: see app/routes/status.tsx
  // const language = await detectLanguage(request);
  // const locales =
  //   languageModuleMap[language]["project/$slug/settings/attachments"];
  // const { authClient } = createAuthClient(request);

  // const sessionUser = await getSessionUser(authClient);

  // // check slug exists (throw bad request if not)
  // invariantResponse(params.slug !== undefined, locales.route.error.invalidRoute, {
  //   status: 400,
  // });

  // const redirectPath = await getRedirectPathOnProtectedProjectRoute({
  //   request,
  //   slug: params.slug,
  //   sessionUser,
  //   authClient,
  // });

  // if (redirectPath !== null) {
  //   return redirect(redirectPath);
  // }

  // const uploadHandler = unstable_composeUploadHandlers(
  //   unstable_createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE })
  // );

  // const formData = await unstable_parseMultipartFormData(
  //   request,
  //   uploadHandler
  // );

  // const intent = formData.get(conform.INTENT);

  // invariantResponse(
  //   intent !== null &&
  //     (intent === "upload_document" ||
  //       intent === "upload_image" ||
  //       intent === "delete_document" ||
  //       intent === "delete_image" ||
  //       intent === "validate/document" ||
  //       intent === "validate/image"),
  //   locales.route.error.invalidAction,
  //   {
  //     status: 400,
  //   }
  // );

  // let submission;
  // let toast;
  // if (intent === "upload_document" || intent === "validate/document") {
  //   const documentUploadSchema = createDocumentUploadSchema(locales);
  //   submission = parse(formData, {
  //     schema: documentUploadSchema,
  //   });

  //   invariantResponse(
  //     typeof submission.value !== "undefined" && submission.value !== null,
  //     locales.route.error.invalidSubmission,
  //     { status: 400 }
  //   );

  //   if (intent === "validate/document") {
  //     return { status: "idle", submission, hash: getHash(submission) };
  //   }

  //   const mimeTypeIsValid = await hasValidMimeType(
  //     submission.value.document,
  //     documentMimeTypes
  //   );
  //   invariantResponse(mimeTypeIsValid, locales.route.error.onStoring, {
  //     status: 400,
  //   });

  //   const filename = submission.value.filename;
  //   const document = submission.value.document;
  //   const error = await storeDocument(authClient, {
  //     slug: params.slug,
  //     filename,
  //     document,
  //   });

  //   invariantResponse(error === null, locales.route.error.onStoring, {
  //     status: 400,
  //   });
  //   toast = {
  //     id: "upload-document-toast",
  //     key: getHash(submission),
  //     message: insertParametersIntoLocale(locales.route.content.document.added, {
  //       name: submission.value.filename,
  //     }),
  //   };
  // } else if (intent === "upload_image" || intent === "validate/image") {
  //   const imageUploadSchema = createImageUploadSchema(locales);
  //   submission = parse(formData, {
  //     schema: imageUploadSchema,
  //   });
  //   invariantResponse(
  //     typeof submission.value !== "undefined" && submission.value !== null,
  //     locales.route.error.invalidSubmission,
  //     { status: 400 }
  //   );

  //   if (intent === "validate/image") {
  //     return { status: "idle", submission, hash: getHash(submission) };
  //   }

  //   const mimeTypeIsValid = await hasValidMimeType(
  //     submission.value.image,
  //     imageMimeTypes
  //   );
  //   invariantResponse(mimeTypeIsValid, locales.route.error.onStoring, {
  //     status: 400,
  //   });

  //   const filename = submission.value.filename;
  //   const image = submission.value.image;

  //   const error = await storeImage(authClient, {
  //     slug: params.slug,
  //     filename,
  //     image,
  //   });

  //   invariantResponse(error === null, locales.route.error.onStoring, {
  //     status: 400,
  //   });
  //   toast = {
  //     id: "upload-image-toast",
  //     key: getHash(submission),
  //     message: insertParametersIntoLocale(locales.route.content.image.added, {
  //       name: submission.value.filename,
  //     }),
  //   };
  // } else if (intent === "delete_document") {
  //   submission = parse(formData, {
  //     schema: actionSchema,
  //   });

  //   invariantResponse(
  //     typeof submission.value !== "undefined" && submission.value !== null,
  //     locales.route.error.invalidSubmission,
  //     { status: 400 }
  //   );

  //   const id = submission.value.id;
  //   await prismaClient.document.delete({
  //     where: {
  //       id,
  //     },
  //   });
  //   toast = {
  //     id: "delete-document-toast",
  //     key: getHash(submission),
  //     message: insertParametersIntoLocale(locales.route.content.document.deleted, {
  //       name: submission.value.filename,
  //     }),
  //   };
  // } else if (intent === "delete_image") {
  //   submission = parse(formData, {
  //     schema: actionSchema,
  //   });

  //   invariantResponse(
  //     typeof submission.value !== "undefined" && submission.value !== null,
  //     locales.route.error.invalidSubmission,
  //     { status: 400 }
  //   );

  //   const id = submission.value.id;
  //   await prismaClient.image.delete({
  //     where: {
  //       id,
  //     },
  //   });
  //   toast = {
  //     id: "delete-image-toast",
  //     key: getHash(submission),
  //     message: insertParametersIntoLocale(locales.route.content.image.deleted, {
  //       name: submission.value.filename,
  //     }),
  //   };
  // } else {
  //   invariantResponse(false, "Bad request", {
  //     status: 400,
  //   });
  // }

  return redirect(request.url);
};

function Attachments() {
  const location = useLocation();

  const [documentName, setDocumentName] = React.useState<string | null>(null);
  const [imageName, setImageName] = React.useState<string | null>(null);
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  // const actionData = useActionData<typeof action>();
  const editFetcher = useFetcher<typeof EditAction>();

  // const documentUploadSchema = createDocumentUploadSchema(locales);
  // const [documentUploadForm, documentUploadFields] = useForm({
  //   shouldValidate: "onInput",
  //   onValidate: (values) => {
  //     const result = parse(values.formData, { schema: documentUploadSchema });
  //     return result;
  //   },
  //   // TODO: Reimplement upload handling (multipart form data parsing) -> poc: see app/routes/status.tsx
  //   // lastSubmission:
  //   //   typeof actionData !== "undefined" ? actionData.submission : undefined,
  //   shouldRevalidate: "onInput",
  // });

  // const imageUploadSchema = createImageUploadSchema(locales);
  // const [imageUploadForm, imageUploadFields] = useForm({
  //   shouldValidate: "onInput",
  //   onValidate: (values) => {
  //     const result = parse(values.formData, { schema: imageUploadSchema });
  //     return result;
  //   },
  //   // TODO: Reimplement upload handling (multipart form data parsing) -> poc: see app/routes/status.tsx
  //   // lastSubmission:
  //   //   typeof actionData !== "undefined" ? actionData.submission : undefined,
  //   shouldRevalidate: "onInput",
  // });

  const [editDocumentForm, editDocumentFields] = useForm({
    shouldValidate: "onInput",
    onValidate: (values) => {
      const schema = documentSchema;
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
      const schema = imageSchema;
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

  // TODO: Reimplement upload handling (multipart form data parsing) -> poc: see app/routes/status.tsx
  // necessary to reset document and image name after successful upload
  // React.useEffect(() => {
  //   if (
  //     typeof actionData !== "undefined" &&
  //     actionData !== null &&
  //     actionData.status === "success" &&
  //     typeof actionData.submission !== "undefined"
  //   ) {
  //     if (actionData.submission.intent === "upload_document") {
  //       setDocumentName(null);
  //     }
  //     if (actionData.submission.intent === "upload_image") {
  //       setImageName(null);
  //     }
  //   }
  // }, [actionData]);

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
          {/* TODO: no-JS version */}
          {/* <Form
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
              <label
                htmlFor={documentUploadFields.document.id}
                className="mv-font-semibold mv-whitespace-nowrap mv-h-10 mv-text-sm mv-text-center mv-px-6 mv-py-2.5 mv-border mv-border-primary mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-rounded-lg mv-cursor-pointer"
              >
                {locales.route.content.document.select}
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
                {locales.route.content.document.action}
              </Button>
            </div>
            <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-4 mv-text-sm mv-font-semibold">
              {typeof documentUploadFields.document.error === "undefined" && (
                <p>
                  {documentName === null
                    ? locales.route.content.document.selection.empty
                    : insertParametersIntoLocale(
                        locales.route.content.document.selection.selected,
                        {
                          name: documentName,
                        }
                      )}
                </p>
              )}
              {typeof documentUploadFields.document.error !== "undefined" && (
                <p className="mv-text-negative-600">
                  {documentUploadFields.document.error}
                </p>
              )}
            </div>
          </Form> */}
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
                          </Modal.Section>
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
                              to={`./download?type=document&id=${relation.document.id}`}
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
                    {locales.route.content.document.downloadAll}
                  </Button>
                </div>
                {/* <Link to={`./download?type=documents`} reloadDocument>
                  <Button Alle herunterladen
                </Link> */}
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
          {/* TODO: no-JS version */}
          {/* <Form
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
              <label
                htmlFor={imageUploadFields.image.id}
                className="mv-font-semibold mv-whitespace-nowrap mv-h-10 mv-text-sm mv-text-center mv-px-6 mv-py-2.5 mv-border mv-border-primary mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-rounded-lg mv-cursor-pointer"
              >
                {locales.route.content.image.select}
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
                {locales.route.content.image.action}
              </Button>
            </div>
            <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-4 mv-text-sm mv-font-semibold">
              {typeof imageUploadFields.image.error === "undefined" && (
                <p>
                  {imageName === null
                    ? locales.route.content.image.selection.empty
                    : insertParametersIntoLocale(
                        locales.route.content.image.selection.selected,
                        {
                          name: imageName,
                        }
                      )}
                </p>
              )}
              {typeof imageUploadFields.image.error !== "undefined" && (
                <p className="mv-text-negative-600">
                  {imageUploadFields.image.error}
                </p>
              )}
            </div>
          </Form> */}
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
                        </Modal.Section>
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
                            to={`./download?type=image&id=${relation.image.id}`}
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
