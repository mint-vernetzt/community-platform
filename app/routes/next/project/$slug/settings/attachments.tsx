import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button, Section, Toast } from "@mint-vernetzt/components";
import {
  NodeOnDiskFile,
  json,
  redirect,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  type DataFunctionArgs,
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
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { BackButton } from "./__components";
import { getExtension, storeDocument, storeImage } from "./attachments.server";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "./utils.server";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

// TODO: DRY
const documentUploadSchema = z.object({
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
    }, "Die Datei darf nicht größer als 5MB sein.")
    .refine((file) => {
      return file.type === "application/pdf" || file.type === "image/jpeg";
    }, "Die Datei muss ein PDF oder ein JPEG sein.")
    .optional(),
});

const imageUploadSchema = z.object({
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
    }, "Die Datei darf nicht größer als 5MB sein.")
    .refine((file) => {
      return file.type === "image/png" || file.type === "image/jpeg";
    }, "Die Datei muss ein PNG oder ein JPEG sein.")
    .optional(),
});

const actionSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
});

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
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
              filename: true,
              description: true,
              path: true,
              credits: true,
              sizeInMB: true,
            },
          },
        },
      },
    },
  });

  invariantResponse(project !== null, "Project not found", { status: 404 });

  return json(project, { headers: response.headers });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
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
      intent === "delete_image",
    "No valid action",
    {
      status: 400,
    }
  );

  let submission;

  if (intent === "upload_document") {
    submission = parse(formData, {
      schema: documentUploadSchema,
    });

    invariantResponse(
      typeof submission.value !== "undefined" && submission.value !== null,
      "No valid submission",
      { status: 400 }
    );

    const filename = submission.value.filename as string;
    const document = submission.value.document as NodeOnDiskFile;
    const error = await storeDocument(authClient, {
      slug: params.slug,
      filename,
      document,
    });

    invariantResponse(error === null, "Error on storing document", {
      status: 400,
    });
  } else if (intent === "upload_image") {
    submission = parse(formData, {
      schema: imageUploadSchema,
    });
    invariantResponse(
      typeof submission.value !== "undefined" && submission.value !== null,
      "No valid submission",
      { status: 400 }
    );

    const filename = submission.value.filename as string;
    const image = submission.value.image as NodeOnDiskFile;

    const error = await storeImage(authClient, {
      slug: params.slug,
      filename,
      image,
    });

    invariantResponse(error === null, "Error on storing document", {
      status: 400,
    });
  } else if (intent === "delete_document") {
    submission = parse(formData, {
      schema: actionSchema,
    });

    invariantResponse(
      typeof submission.value !== "undefined" && submission.value !== null,
      "No valid submission",
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
      "No valid submission",
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
      <BackButton to={location.pathname}>Material verwalten</BackButton>
      <p className="mv-my-6 md:mv-mt-0">
        Füge Materialien wie Flyer, Bilder, Checklisten zu Deinem Projekt hinzu
        oder entferne sie.
      </p>
      <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            Dokumente hochladen
          </h2>
          <p>Mögliche Dateiformate: PDF, jpg. Maximal 5MB.</p>
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
                Datei auswählen
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
                Datei hochladen
              </Button>
            </div>
            <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-4 mv-text-sm mv-font-semibold">
              {typeof documentUploadfields.document.error === "undefined" && (
                <p>
                  {documentName === null
                    ? "Du hast keine Datei ausgewählt."
                    : `${documentName} ausgewählt.`}
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
                    {actionData.submission.value.filename} hinzugefügt.
                  </Toast>
                )}
            </div>
          </Form>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <>
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Aktuell hochgeladene Dokumente
            </h2>
            {loaderData !== null && loaderData.documents.length > 0 ? (
              <>
                <ul>
                  {loaderData.documents.map((relation) => {
                    return (
                      <li
                        key={relation.document.id}
                        className="mv-flex mv-gap-2"
                      >
                        {relation.document.filename}
                        <Form method="post" encType="multipart/form-data">
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
                          <Button type="submit">Löschen</Button>
                        </Form>
                        <Link
                          to={`./download?type=document&id=${relation.document.id}`}
                          target="_blank"
                          download
                        >
                          Herunterladen
                        </Link>
                        <Link
                          to={`./edit?type=document&id=${relation.document.id}&deep&modal`}
                        >
                          Bearbeiten
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Link to={`./download?type=documents`} target="_blank">
                  Alle herunterladen
                </Link>
              </>
            ) : (
              <p>Keine Dokumente vorhanden.</p>
            )}
            {typeof actionData !== "undefined" &&
              actionData !== null &&
              actionData.status === "success" &&
              typeof actionData.submission !== "undefined" &&
              actionData.submission.intent === "delete_document" &&
              typeof actionData.submission.value !== "undefined" &&
              actionData.submission.value !== null && (
                <Toast key={actionData.hash}>
                  {actionData.submission.value.filename} gelöscht.
                </Toast>
              )}
          </>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            Bildmaterial hochladen
          </h2>
          <p>Mögliche Dateiformate: jpg, png. Maximal 5MB.</p>
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
                Datei auswählen
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
                Datei hochladen
              </Button>
            </div>
            <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-4 mv-text-sm mv-font-semibold">
              {typeof imageUploadFields.image.error === "undefined" && (
                <p>
                  {imageName === null
                    ? "Du hast keine Datei ausgewählt."
                    : `${imageName} ausgewählt.`}
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
                    {actionData.submission.value.filename} hinzugefügt.
                  </Toast>
                )}
            </div>
          </Form>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            Aktuell hochgeladenes Bildmaterial
          </h2>
          {loaderData !== null && loaderData.images.length > 0 ? (
            <>
              <ul>
                {loaderData.images.map((relation) => {
                  return (
                    <li key={relation.image.id} className="mv-flex mv-gap-2">
                      {relation.image.filename}{" "}
                      <Form method="post" encType="multipart/form-data">
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
                        <Button type="submit">Löschen</Button>
                        <Link
                          to={`./download?type=image&id=${relation.image.id}`}
                          target="_blank"
                        >
                          Herunterladen
                        </Link>
                        <Link
                          to={`./edit?type=image&id=${relation.image.id}&deep&modal`}
                        >
                          Bearbeiten
                        </Link>
                      </Form>
                    </li>
                  );
                })}
              </ul>
              <Link to={`./download?type=images`} target="_blank">
                Alle herunterladen
              </Link>
            </>
          ) : (
            <p>Keine Bilder vorhanden.</p>
          )}
          {typeof actionData !== "undefined" &&
            actionData !== null &&
            actionData.status === "success" &&
            typeof actionData.submission !== "undefined" &&
            actionData.submission.intent === "delete_image" &&
            typeof actionData.submission.value !== "undefined" &&
            actionData.submission.value !== null && (
              <Toast key={actionData.hash}>
                {actionData.submission.value.filename} gelöscht.
              </Toast>
            )}
        </div>
      </div>
    </Section>
  );
}

export default Attachments;
