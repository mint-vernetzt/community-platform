import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { publishSchema } from "./detail";
import { parseWithZod } from "@conform-to/zod-v1";
import { captureException } from "@sentry/node";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { z } from "zod";
import { type SupabaseClient } from "@supabase/supabase-js";
import {
  createImageUploadSchema,
  disconnectImageSchema,
} from "~/components/ImageCropper/ImageCropper";
import { uploadFileToStorage } from "~/storage.server";
import { FILE_FIELD_NAME } from "~/storage.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export type ProjectDetailLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["project/$slug/detail"];

export async function uploadImage(options: {
  request: Request;
  formData: FormData;
  authClient: SupabaseClient;
  slug: string;
  locales: ProjectDetailLocales;
}) {
  const { request, formData, authClient, slug, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: createImageUploadSchema(locales).transform(async (data, ctx) => {
      const { file, bucket, uploadKey } = data;
      const { fileMetadataForDatabase, error } = await uploadFileToStorage({
        file,
        authClient,
        bucket,
      });
      if (error !== null) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      if (uploadKey !== "background" && uploadKey !== "logo") {
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
          data: {
            [uploadKey]: fileMetadataForDatabase.path,
          },
        });
      } catch (error) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }

      return { ...data, uploadKey: uploadKey };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null, redirectUrl: null };
  }

  // Close modal after redirect
  const redirectUrl = new URL(request.url);
  redirectUrl.searchParams.delete(`modal-${submission.value.uploadKey}`);
  return {
    submission: null,
    toast: {
      id: "change-image",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.upload.success.imageAdded, {
        imageType:
          locales.upload.success.imageTypes[submission.value.uploadKey],
      }),
    },
    redirectUrl: redirectUrl.toString(),
  };
}

export async function disconnectImage(options: {
  request: Request;
  formData: FormData;
  slug: string;
  locales: ProjectDetailLocales;
}) {
  const { request, formData, slug, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: disconnectImageSchema.transform(async (data, ctx) => {
      const { uploadKey } = data;
      try {
        if (uploadKey !== "background" && uploadKey !== "logo") {
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.onStoring,
            path: [FILE_FIELD_NAME],
          });
          return z.NEVER;
        }
        await prismaClient.project.update({
          where: {
            slug,
          },
          data: {
            [uploadKey]: null,
          },
        });
      } catch (error) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }

      return { ...data, uploadKey: uploadKey };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null, redirectUrl: null };
  }

  // Close modal after redirect
  const redirectUrl = new URL(request.url);
  redirectUrl.searchParams.delete(`modal-${submission.value.uploadKey}`);
  return {
    submission: null,
    toast: {
      id: "disconnect-image",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.upload.success.imageRemoved, {
        imageType:
          locales.upload.success.imageTypes[submission.value.uploadKey],
      }),
    },
    redirectUrl: redirectUrl.toString(),
  };
}

export async function publishOrHideProject(options: {
  formData: FormData;
  slug: string;
  locales: ProjectDetailLocales;
}) {
  const { formData, slug, locales } = options;

  const submission = await parseWithZod(formData, {
    schema: publishSchema.transform(async (data, ctx) => {
      const { intent } = data;
      try {
        await prismaClient.project.update({
          where: {
            slug: slug,
          },
          data: {
            published: intent === "publish" ? true : false,
          },
        });
      } catch (error) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onPublishing,
          path: [INTENT_FIELD_NAME],
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
      id: "publish-hide-project",
      key: `${new Date().getTime()}`,
      message:
        submission.value[INTENT_FIELD_NAME] === "publish"
          ? locales.route.content.published
          : locales.route.content.hided,
    },
  };
}
