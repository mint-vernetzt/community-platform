import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import {
  Form,
  type LoaderFunctionArgs,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
} from "react-router";
import { z } from "zod";
import { prismaClient } from "~/prisma.server";
import { uploadFileFromMultipartFormData as uploadFileFromMultipartForm } from "~/storage.server";
import {
  BUCKET_FIELD_NAME,
  BUCKET_NAME_DOCUMENTS,
  DOCUMENT_MIME_TYPES,
  documentSchema,
  FILE_FIELD_NAME,
} from "~/storage.shared";
import { redirectWithToast } from "~/toast.server";
import * as Sentry from "@sentry/remix";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/i18n.server";
import { type ProjectAttachmentSettingsLocales } from "./project/$slug/settings/attachments.server";
import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { useHydrated } from "remix-utils/use-hydrated";
import React from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/attachments"];
  return { currentTimestamp: Date.now(), locales };
  // return redirect("/");
};

const createDocumentUploadSchema = (
  locales: ProjectAttachmentSettingsLocales
) =>
  z.object({
    ...documentSchema(locales),
  });

// const createImageUploadSchema = (locales: ProjectAttachmentSettingsLocales) =>
//   z.object({
//     ...imageSchema(locales),
//   });

export const action = async ({ request }: ActionFunctionArgs) => {
  // const slug = getParamValueOrThrow(params, "slug");
  const slug = "0_developerevent-m6f1c1tc";

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/attachments"];
  const { formData, path, file, fileType } = await uploadFileFromMultipartForm(
    request
  );

  const submission = await parseWithZod(formData, {
    schema: createDocumentUploadSchema(locales).transform(async (data, ctx) => {
      // Get additional data like title, description and whatever the route needs from the client
      const document = {
        filename: file.name,
        path: path,
        extension: fileType.ext,
        sizeInMB: Math.round((file.size / 1024 / 1024) * 100) / 100,
        mimeType: fileType.mime,
      };
      try {
        await prismaClient.event.update({
          where: {
            slug,
          },
          data: {
            documents: {
              create: {
                document: {
                  create: { ...document },
                },
              },
            },
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error({ error });
        Sentry.captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }

      return { ...data };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
  }

  return redirectWithToast(request.url, {
    id: "upload-document",
    key: `${new Date().getTime()}`,
    message: "Document uploaded successfully",
  });
};

export default function Status() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();

  type SelectedFile = {
    name: string;
    sizeInMB: number;
  };
  const [selectedFileNames, setSelectedFileNames] = React.useState<
    SelectedFile[]
  >([]);
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
    setSelectedFileNames([]);
  }, [loaderData]);

  console.log(documentUploadForm.errors);

  return (
    <>
      <Form
        {...getFormProps(documentUploadForm)}
        method="post"
        encType="multipart/form-data"
      >
        {/* TODO: <FileInput> component */}
        <noscript>
          <input
            {...getInputProps(documentUploadFields[FILE_FIELD_NAME], {
              type: "file",
            })}
            key={FILE_FIELD_NAME}
            className="mv-mb-2"
            accept={DOCUMENT_MIME_TYPES.join(", ")}
          />
        </noscript>
        <div className="mv-grid mv-grid-cols-2 mv-gap-2 mv-w-fit">
          {isHydrated === true ? (
            <>
              <Button as="label" htmlFor={FILE_FIELD_NAME}>
                Dokument auswählen
              </Button>
              <input
                {...getInputProps(documentUploadFields[FILE_FIELD_NAME], {
                  type: "file",
                })}
                id={FILE_FIELD_NAME}
                key={FILE_FIELD_NAME}
                className="mv-hidden"
                accept={DOCUMENT_MIME_TYPES.join(", ")}
                onChange={(event) => {
                  setSelectedFileNames(
                    event.target.files !== null
                      ? Array.from(event.target.files).map((file) => {
                          return {
                            name: file.name,
                            sizeInMB:
                              Math.round((file.size / 1024 / 1024) * 100) / 100,
                          };
                        })
                      : []
                  );
                  documentUploadForm.validate();
                }}
              />
            </>
          ) : (
            <Button as="label" disabled>
              Dokument auswählen
            </Button>
          )}
          <input
            {...getInputProps(documentUploadFields[BUCKET_FIELD_NAME], {
              type: "hidden",
            })}
            key={BUCKET_FIELD_NAME}
          />
          <Button
            type="submit"
            name="intent"
            defaultValue="submit"
            fullSize
            // Don't disable button when js is disabled
            disabled={
              isHydrated
                ? selectedFileNames.length === 0 ||
                  documentUploadForm.dirty === false ||
                  documentUploadForm.valid === false
                : false
            }
          >
            Dokument hochladen
          </Button>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-4 mv-text-sm mv-font-semibold">
          {selectedFileNames.length > 0 ? (
            <p>
              {selectedFileNames
                .map((file) => {
                  return `${file.name} (${file.sizeInMB} MB)`;
                })
                .join(", ")}
            </p>
          ) : isHydrated === true ? (
            "Du hast keine Datei ausgewählt."
          ) : null}
          {typeof documentUploadFields[FILE_FIELD_NAME].errors !==
            "undefined" &&
          documentUploadFields[FILE_FIELD_NAME].errors.length > 0 ? (
            <div>
              {documentUploadFields[FILE_FIELD_NAME].errors.map(
                (error, index) => {
                  return (
                    <div
                      id={documentUploadFields[FILE_FIELD_NAME].errorId}
                      key={index}
                      className="mv-text-sm mv-font-semibold mv-text-negative-600"
                    >
                      {error}
                    </div>
                  );
                }
              )}
            </div>
          ) : null}
        </div>
      </Form>
    </>
  );
}
