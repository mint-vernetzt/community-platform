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
  useActionData,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import React from "react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { createHashFromString } from "~/utils.server";
import { BackButton } from "./__components";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "./utils.server";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
const uploadSchema = z.object({
  filename: z.string().optional(),
  document: z
    .any()
    .refine((file) => {
      return file.size <= MAX_UPLOAD_SIZE;
    }, "Die Datei darf nicht größer als 5MB sein.")
    .refine((file) => {
      return file.type === "application/pdf" || file.type.startsWith("image/");
    }, "Die Datei muss ein PDF oder ein Bild sein.")
    .optional(),
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
              filename: true,
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
              name: true,
              alt: true,
              path: true,
              credits: true,
              sizeInMB: true,
            },
          },
        },
      },
    },
  });

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

  invariantResponse(intent === "upload_document", "No valid action", {
    status: 400,
  });

  const submission = parse(formData, {
    schema: uploadSchema,
  });

  const submissionHash = getSubmissionHash(submission);

  if (typeof submission.value === "undefined" || submission.value === null) {
    return json(
      { status: "error", submission, hash: submissionHash } as const,
      {
        status: 400,
      }
    );
  }

  const filename = submission.value.filename as string;
  const document = submission.value.document as NodeOnDiskFile;

  const mimeType = document.type;
  const extension = filename.substring(
    filename.lastIndexOf(".") + 1,
    filename.length
  );
  const sizeInMB = Math.round((document.size / 1024 / 1024) * 100) / 100;
  const buffer = await document.arrayBuffer();
  const contentHash = await createHashFromString(buffer.toString());

  const path = `${contentHash.substring(0, 2)}/${contentHash.substring(
    2
  )}/${filename}`;

  const result = await authClient.storage
    .from("documents")
    .upload(path, buffer);

  if (result.error !== null) {
    return json(
      { status: "error", submission, hash: submissionHash } as const,
      {
        status: 400,
      }
    );
  }

  // validate persisency in storage
  const publicURL = getPublicURL(authClient, "documents", path);

  if (publicURL === null) {
    return json(
      { status: "error", submission, hash: submissionHash } as const,
      {
        status: 400,
      }
    );
  }

  await prismaClient.project.update({
    where: {
      slug: params.slug,
    },
    data: {
      documents: {
        create: {
          document: {
            create: {
              filename,
              path,
              extension,
              sizeInMB,
              mimeType,
            },
          },
        },
      },
      updatedAt: new Date(),
    },
  });

  return json({ status: "success", submission, hash: submissionHash } as const);
};

function Attachments() {
  const location = useLocation();

  const [documentName, setDocumentName] = React.useState<string | null>(null);
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    shouldValidate: "onInput",
    onValidate: (values) => {
      const result = parse(values.formData, { schema: uploadSchema });
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

  // necessary to reset document name after successful upload
  React.useEffect(() => {
    if (
      typeof actionData !== "undefined" &&
      actionData !== null &&
      actionData.status === "success" &&
      actionData.submission.intent === "upload_document"
    ) {
      setDocumentName(null);
    }
  }, [actionData]);

  console.log("loaderData", loaderData);

  return (
    <Section>
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
          <Form method="post" encType="multipart/form-data" {...form.props}>
            <div className="mv-flex mv-flex-col md:mv-flex-row mv-gap-2">
              <input
                hidden
                {...fields.filename}
                defaultValue={documentName !== null ? documentName : ""}
              />
              <label
                htmlFor={fields.document.id}
                className="mv-font-semibold mv-whitespace-nowrap mv-h-10 mv-text-sm mv-text-center mv-px-6 mv-py-2.5 mv-border mv-border-primary mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-rounded-lg mv-cursor-pointer"
              >
                Datei auswählen
                <input
                  id={fields.document.id}
                  name={fields.document.name}
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleDocumentChange}
                  hidden
                />
              </label>

              <Button
                // TODO: check type issue
                disabled={
                  typeof window !== "undefined"
                    ? typeof fields.document.error !== "undefined" ||
                      documentName === null
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
              {typeof fields.document.error === "undefined" && (
                <p>
                  {documentName === null
                    ? "Du hast keine Datei ausgewählt."
                    : `${documentName} ausgewählt.`}
                </p>
              )}
              {typeof fields.document.error !== "undefined" && (
                <p className="mv-text-negative-600">{fields.document.error}</p>
              )}
              {typeof actionData !== "undefined" &&
                actionData !== null &&
                actionData.status === "success" &&
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
      </div>
    </Section>
  );
}

export default Attachments;
