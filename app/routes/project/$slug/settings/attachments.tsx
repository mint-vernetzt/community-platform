import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button, Image, Section, Toast } from "@mint-vernetzt/components";
import {
  type ActionFunctionArgs,
  json,
  redirect,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  type LoaderFunctionArgs,
  type NodeOnDiskFile,
} from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useActionData,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import React from "react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { BackButton, MaterialList } from "./__components";
import { getExtension, storeDocument, storeImage } from "./attachments.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "./utils.server";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
const i18nNS = ["routes/project/settings/attachments"];
export const handle = {
  i18n: i18nNS,
};

const createDocumentUploadSchema = (t: TFunction) =>
  z.object({
    filename: z
      .string()
      .transform((filename) => {
        const extension = getExtension(filename);
        return `${filename
          .replace(`.${extension}`, "")
          .replace(/\W/g, "_")}.${extension}`; // needed for storing on s3
      })
      .optional(),
    document: z
      .any()
      .refine((file) => {
        return file.size <= MAX_UPLOAD_SIZE;
      }, t("validation.document.size"))
      .refine((file) => {
        return file.type === "application/pdf" || file.type === "image/jpeg";
      }, t("validation.document.type"))
      .optional(),
  });

const createImageUploadSchema = (t: TFunction) =>
  z.object({
    filename: z
      .string()
      .transform((filename) => {
        const extension = getExtension(filename);
        return `${filename
          .replace(`.${extension}`, "")
          .replace(/\W/g, "_")}.${extension}`; // needed for storing on s3
      })
      .optional(),
    image: z
      .any()
      .refine((file) => {
        return file.size <= MAX_UPLOAD_SIZE;
      }, t("validation.image.size"))
      .refine((file) => {
        return file.type === "image/png" || file.type === "image/jpeg";
      }, t("validation.image.type"))
      .optional(),
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
  project.images = project.images.map((relation) => {
    const publicURL = getPublicURL(authClient, relation.image.path);
    const thumbnail = getImageURL(publicURL, {
      resize: { type: "fill", width: 144 },
    });
    return { ...relation, image: { ...relation.image, thumbnail } };
  });

  return json(project);
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

  const intent = formData.get(conform.INTENT) as string;

  invariantResponse(
    intent === "upload_document" ||
      intent === "upload_image" ||
      intent === "delete_document" ||
      intent === "delete_image" ||
      intent === "validate/document" ||
      intent === "validate/image",
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

    const filename = submission.value.filename as string;
    const document = submission.value.document as NodeOnDiskFile;
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

    const filename = submission.value.filename as string;
    const image = submission.value.image as NodeOnDiskFile;

    const error = await storeImage(authClient, {
      slug: params.slug,
      filename,
      image,
    });
    console.log(error);

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

    const id = submission.value.id as string;
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

    const id = submission.value.id as string;
    await prismaClient.image.delete({
      where: {
        id,
      },
    });
  }

  const submissionHash =
    typeof submission !== "undefined" ? getSubmissionHash(submission) : null;

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

  const { t } = useTranslation(i18nNS);

  const documentUploadSchema = createDocumentUploadSchema(t);
  const [documentUploadForm, documentUploadfields] = useForm({
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

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
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
    if (event.target.files !== null) {
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
      <Outlet />
      <BackButton to={location.pathname}>{t("content.back")}</BackButton>
      <p className="mv-my-6 md:mv-mt-0">{t("content.description")}</p>
      <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
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
            <div className="mv-flex mv-flex-col md:mv-flex-row mv-gap-2">
              <input
                hidden
                {...documentUploadfields.filename}
                defaultValue={documentName !== null ? documentName : ""}
              />
              {/* TODO: component! */}
              <label
                htmlFor={documentUploadfields.document.id}
                className="mv-font-semibold mv-whitespace-nowrap mv-h-10 mv-text-sm mv-text-center mv-px-6 mv-py-2.5 mv-border mv-border-primary mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-rounded-lg mv-cursor-pointer"
              >
                {t("content.document.select")}
                <input
                  id={documentUploadfields.document.id}
                  name={documentUploadfields.document.name}
                  type="file"
                  accept="application/pdf,image/jpeg"
                  onChange={handleDocumentChange}
                  hidden
                />
              </label>

              <Button
                // TODO: check type issue
                // @ts-ignore
                disabled={
                  typeof window !== "undefined"
                    ? typeof documentUploadfields.document.error !==
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
              {typeof documentUploadfields.document.error === "undefined" && (
                <p>
                  {documentName === null
                    ? t("content.document.selection.empty")
                    : t("content.document.selection.selected", {
                        name: documentName,
                      })}
                </p>
              )}
              {typeof documentUploadfields.document.error !== "undefined" && (
                <p className="mv-text-negative-600">
                  {documentUploadfields.document.error}
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
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <>
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("content.document.current")}
            </h2>
            {loaderData !== null && loaderData.documents.length > 0 ? (
              <>
                <MaterialList>
                  {loaderData.documents.map((relation) => {
                    return (
                      <MaterialList.Item key={relation.document.id}>
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
                          className="mv-shrink-0 mv-p-4 mv-flex mv-gap-2 lg:mv-gap-4 mv-ml-auto"
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
                            to={`./edit?type=document&id=${relation.document.id}&deep&modal`}
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
                    );
                  })}
                </MaterialList>
                <div className="mv-w-full md:mv-max-w-fit">
                  <Button
                    as="a"
                    href={`./download?type=documents`}
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
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
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
            <div className="mv-flex mv-flex-col md:mv-flex-row mv-gap-2">
              <input
                hidden
                {...imageUploadFields.filename}
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
                  accept="image/png,image/jpeg"
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
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {t("content.image.current")}
          </h2>
          {loaderData !== null && loaderData.images.length > 0 ? (
            <>
              <MaterialList>
                {loaderData.images.map((relation) => {
                  return (
                    <MaterialList.Item key={relation.image.id}>
                      {/* TODO: fix type issue */}
                      {/* @ts-ignore */}
                      {typeof relation.image.thumbnail !== "undefined" && (
                        <Image
                          // @ts-ignore
                          src={relation.image.thumbnail}
                          alt={relation.image.description || ""}
                        />
                      )}
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
                        className="mv-shrink-0 mv-p-4 mv-flex mv-gap-2 lg:mv-gap-4 mv-ml-auto"
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
                          to={`./edit?type=image&id=${relation.image.id}&deep&modal`}
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
                  );
                })}
              </MaterialList>
              <div className="mv-w-full md:mv-max-w-fit">
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
