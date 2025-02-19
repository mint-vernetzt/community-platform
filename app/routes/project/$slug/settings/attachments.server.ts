import { parseWithZod } from "@conform-to/zod-v1";
import * as Sentry from "@sentry/remix";
import { type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { uploadFileToStorage } from "~/storage.server";
import {
  BUCKET_FIELD_NAME,
  BUCKET_NAME_DOCUMENTS,
  BUCKET_NAME_IMAGES,
  FILE_FIELD_NAME,
} from "~/storage.shared";
import {
  createDocumentUploadSchema,
  createEditDocumentSchema,
  createEditImageSchema,
  createImageUploadSchema,
  disconnectAttachmentSchema,
} from "./attachments";

export type ProjectAttachmentSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["project/$slug/settings/attachments"];

export async function uploadFile(options: {
  formData: FormData;
  authClient: SupabaseClient;
  slug: string;
  locales: ProjectAttachmentSettingsLocales;
}) {
  const { formData, authClient, slug, locales } = options;
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
      const { file } = data;
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

export async function editDocument(options: {
  request: Request;
  formData: FormData;
  locales: ProjectAttachmentSettingsLocales;
}) {
  const { request, formData, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: createEditDocumentSchema(locales).transform(async (data, ctx) => {
      const { id, ...rest } = data;
      try {
        await prismaClient.document.update({
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
      return { ...data };
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
          name: submission.value.title,
        }
      ),
    },
    redirectUrl: redirectUrl.toString(),
  };
}

export async function editImage(options: {
  request: Request;
  formData: FormData;
  locales: ProjectAttachmentSettingsLocales;
}) {
  const { request, formData, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: createEditImageSchema(locales).transform(async (data, ctx) => {
      const { id, ...rest } = data;
      try {
        await prismaClient.image.update({
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
      return { ...data };
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
      id: "edit-image",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.route.content.image.updated, {
        name: submission.value.title,
      }),
    },
    redirectUrl: redirectUrl.toString(),
  };
}

export async function disconnectDocument(options: {
  formData: FormData;
  locales: ProjectAttachmentSettingsLocales;
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

export async function disconnectImage(options: {
  formData: FormData;
  locales: ProjectAttachmentSettingsLocales;
}) {
  const { formData, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: disconnectAttachmentSchema.transform(async (data, ctx) => {
      const { id } = data;
      let image;
      try {
        image = await prismaClient.image.delete({
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
      return { ...data, image };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null };
  }
  return {
    submission: null,
    toast: {
      id: "delete-image",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.route.content.image.deleted, {
        name: submission.value.image.title || submission.value.image.filename,
      }),
    },
  };
}
