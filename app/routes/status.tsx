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
import {
  deleteAllTemporaryFiles,
  parseMultipartFormData,
  uploadFileFromMultipartFormData,
} from "~/storage.server";
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
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { FileInput, type SelectedFile } from "~/components-next/FileInput";

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
  const { formData, error } = await parseMultipartFormData(request);
  if (error !== null || formData === null) {
    console.error({ error });
    Sentry.captureException(error);
    // TODO: How can we add this to the zod ctx?
    return redirectWithToast(request.url, {
      id: "upload-document",
      key: `${new Date().getTime()}`,
      message: locales.route.error.onStoring,
    });
  }

  const submission = await parseWithZod(formData, {
    schema: createDocumentUploadSchema(locales).transform(async (data, ctx) => {
      const { path, fileType, error } = await uploadFileFromMultipartFormData(
        request,
        {
          file: data.file,
          bucketName: data.bucket,
        }
      );
      if (error !== null || path === null || fileType === null) {
        console.error({ error });
        Sentry.captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      const document = {
        filename: data.file.name,
        path: path,
        extension: fileType.ext,
        sizeInMB: Math.round((data.file.size / 1000 / 1000) * 100) / 100,
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
    await deleteAllTemporaryFiles();
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
  }

  return redirectWithToast(request.url, {
    id: "upload-document",
    key: `${new Date().getTime()}`,
    message: insertParametersIntoLocale(locales.route.content.document.added, {
      name: submission.value.file.name,
    }),
  });
};

export default function Status() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();

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

  return (
    <>
      <Form
        {...getFormProps(documentUploadForm)}
        method="post"
        encType="multipart/form-data"
      >
        <FileInput
          as="textButton"
          selectedFileNames={selectedFileNames}
          errors={
            typeof documentUploadFields[FILE_FIELD_NAME].errors === "undefined"
              ? undefined
              : documentUploadFields[FILE_FIELD_NAME].errors.map((error) => {
                  return {
                    id: documentUploadFields[FILE_FIELD_NAME].errorId,
                    message: error,
                  };
                })
          }
          fileInputProps={{
            ...getInputProps(documentUploadFields[FILE_FIELD_NAME], {
              type: "file",
            }),
            id: FILE_FIELD_NAME,
            key: FILE_FIELD_NAME,
            className: "mv-hidden",
            accept: DOCUMENT_MIME_TYPES.join(", "),
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              setSelectedFileNames(
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
            key: FILE_FIELD_NAME,
            className: "mv-mb-2",
            accept: DOCUMENT_MIME_TYPES.join(", "),
          }}
        >
          <FileInput.Text>Dokument auswählen</FileInput.Text>
        </FileInput>
        <FileInput
          selectedFileNames={selectedFileNames}
          errors={
            typeof documentUploadFields[FILE_FIELD_NAME].errors === "undefined"
              ? undefined
              : documentUploadFields[FILE_FIELD_NAME].errors.map((error) => {
                  return {
                    id: documentUploadFields[FILE_FIELD_NAME].errorId,
                    message: error,
                  };
                })
          }
          fileInputProps={{
            ...getInputProps(documentUploadFields[FILE_FIELD_NAME], {
              type: "file",
            }),
            id: FILE_FIELD_NAME,
            key: FILE_FIELD_NAME,
            className: "mv-hidden",
            accept: DOCUMENT_MIME_TYPES.join(", "),
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              setSelectedFileNames(
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
            key: FILE_FIELD_NAME,
            className: "mv-mb-2",
            accept: DOCUMENT_MIME_TYPES.join(", "),
          }}
        >
          <FileInput.Text>Dokument auswählen</FileInput.Text>
          <FileInput.Controls>
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
          </FileInput.Controls>
        </FileInput>
      </Form>
    </>
  );
}
