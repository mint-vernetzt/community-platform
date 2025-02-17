import { parseWithZod } from "@conform-to/zod-v1";
import * as Sentry from "@sentry/remix";
import { z } from "zod";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import {
  deleteAllTemporaryFiles,
  uploadFileFromMultipartFormData,
} from "~/storage.server";
import {
  BUCKET_FIELD_NAME,
  BUCKET_NAME_DOCUMENTS,
  BUCKET_NAME_IMAGES,
  FILE_FIELD_NAME,
} from "~/storage.shared";
import {
  createDocumentUploadSchema,
  createImageUploadSchema,
} from "./attachments";

export type ProjectAttachmentSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["project/$slug/settings/attachments"];

export async function uploadFile(options: {
  request: Request;
  formData: FormData;
  slug: string;
  locales: ProjectAttachmentSettingsLocales;
}) {
  const { request, formData, slug, locales } = options;
  const bucket = formData.get(BUCKET_FIELD_NAME);
  // TODO: How can we add this to the zod ctx?
  if (bucket !== BUCKET_NAME_DOCUMENTS && bucket !== BUCKET_NAME_IMAGES) {
    return {
      submission: null,
      toast: {
        id: "invalid-bucket",
        key: `${new Date().getTime()}`,
        message: locales.route.error.invalidSubmission,
        level: "negative" as const,
      },
    };
  }
  const schema =
    bucket === BUCKET_NAME_DOCUMENTS
      ? createDocumentUploadSchema(locales)
      : createImageUploadSchema(locales);
  const submission = await parseWithZod(formData, {
    schema: schema.transform(async (data, ctx) => {
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
      const fileMetadataForDatabase = {
        filename: data.file.name,
        path: path,
        extension: fileType.ext,
        sizeInMB: Math.round((data.file.size / 1000 / 1000) * 100) / 100,
        mimeType: fileType.mime,
      };
      try {
        await prismaClient.project.update({
          where: {
            slug,
          },
          data:
            data[BUCKET_FIELD_NAME] === "documents"
              ? {
                  documents: {
                    create: {
                      document: {
                        create: { ...fileMetadataForDatabase },
                      },
                    },
                  },
                  updatedAt: new Date(),
                }
              : {
                  images: {
                    create: {
                      image: {
                        create: { ...fileMetadataForDatabase },
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
    return { submission, toast: null };
  }

  return {
    submission: null,
    toast: {
      id: "upload-file",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        submission.value[BUCKET_FIELD_NAME] === "documents"
          ? locales.route.content.document.added
          : locales.route.content.image.added,
        {
          name: submission.value.file.name,
        }
      ),
    },
  };
}
