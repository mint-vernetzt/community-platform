import { parseWithZod } from "@conform-to/zod-v1";
import { type SupabaseClient } from "@supabase/supabase-js";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import {
  createDocumentUploadSchema,
  createEditDocumentSchema,
  disconnectAttachmentSchema,
} from "./documents";
import { uploadFileToStorage } from "~/storage.server";
import * as Sentry from "@sentry/node";
import { FILE_FIELD_NAME } from "~/storage.shared";
import { z } from "zod";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export type EventDocumentsSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["event/$slug/settings/documents"];

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      slug: true,
      published: true,
      documents: {
        select: {
          document: {
            select: {
              id: true,
              title: true,
              filename: true,
              sizeInMB: true,
              extension: true,
              description: true,
              mimeType: true,
            },
          },
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function uploadFile(options: {
  formData: FormData;
  authClient: SupabaseClient;
  slug: string;
  locales: EventDocumentsSettingsLocales;
}) {
  const { formData, authClient, slug, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: createDocumentUploadSchema(locales).transform(async (data, ctx) => {
      const { file, bucket } = data;
      const { fileMetadataForDatabase, error } = await uploadFileToStorage({
        file,
        authClient,
        bucket,
      });
      if (error !== null) {
        console.error({ error });
        Sentry.captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      try {
        await prismaClient.event.update({
          where: {
            slug,
          },
          data: {
            documents: {
              create: {
                document: {
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
    return { submission, toast: null };
  }

  return {
    submission: null,
    toast: {
      id: "upload-file",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.document.added,
        {
          name: submission.value.file.name,
        }
      ),
    },
  };
}

export async function editDocument(options: {
  request: Request;
  formData: FormData;
  locales: EventDocumentsSettingsLocales;
}) {
  const { request, formData, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: createEditDocumentSchema(locales).transform(async (data, ctx) => {
      const { id, ...rest } = data;
      let document;
      try {
        document = await prismaClient.document.update({
          select: {
            filename: true,
          },
          where: {
            id,
          },
          data: {
            ...rest,
          },
        });
      } catch (error) {
        console.error({ error });
        Sentry.captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onUpdating,
          path: ["description"],
        });
        return z.NEVER;
      }
      return { ...data, document };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null, redirectUrl: null };
  }
  // Close modal after redirect
  const redirectUrl = new URL(request.url);
  redirectUrl.searchParams.delete(`modal-edit-${submission.value.id}`);
  return {
    submission: null,
    toast: {
      id: "edit-document",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.document.updated,
        {
          name: submission.value.title || submission.value.document.filename,
        }
      ),
    },
    redirectUrl: redirectUrl.toString(),
  };
}

export async function disconnectDocument(options: {
  formData: FormData;
  locales: EventDocumentsSettingsLocales;
}) {
  const { formData, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: disconnectAttachmentSchema.transform(async (data, ctx) => {
      const { id } = data;
      let document;
      try {
        document = await prismaClient.document.delete({
          select: {
            title: true,
            filename: true,
          },
          where: {
            id,
          },
        });
      } catch (error) {
        console.error({ error });
        Sentry.captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onUpdating,
          path: ["id"],
        });
        return z.NEVER;
      }
      return { ...data, document };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null };
  }
  return {
    submission: null,
    toast: {
      id: "delete-document",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.document.deleted,
        {
          name:
            submission.value.document.title ||
            submission.value.document.filename,
        }
      ),
    },
  };
}
