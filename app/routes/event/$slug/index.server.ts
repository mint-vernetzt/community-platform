import { parseWithZod } from "@conform-to/zod-v1";
import * as Sentry from "@sentry/node";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { z } from "zod";
import {
  createEventAbuseReport,
  sendNewReportMailToSupport,
} from "~/abuse-reporting.server";
import {
  disconnectImageSchema,
  createImageUploadSchema,
} from "~/components/ImageCropper/ImageCropper";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { uploadFileToStorage } from "~/storage.server";
import { FILE_FIELD_NAME } from "~/storage.shared";
import { createAbuseReportSchema } from ".";

export type EventDetailLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["event/$slug/index"];

export async function uploadBackgroundImage(options: {
  request: Request;
  formData: FormData;
  authClient: SupabaseClient;
  slug: string;
  locales: EventDetailLocales;
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
        Sentry.captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      if (uploadKey !== "background") {
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
            [uploadKey]: fileMetadataForDatabase.path,
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

export async function disconnectBackgroundImage(options: {
  request: Request;
  formData: FormData;
  slug: string;
  locales: EventDetailLocales;
}) {
  const { request, formData, slug, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: disconnectImageSchema.transform(async (data, ctx) => {
      const { uploadKey } = data;
      if (uploadKey !== "background") {
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
            [uploadKey]: null,
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

export async function submitEventAbuseReport(options: {
  request: Request;
  formData: FormData;
  slug: string;
  locales: EventDetailLocales;
  authClient: SupabaseClient;
  sessionUser: User;
}) {
  const { request, formData, slug, locales, sessionUser } = options;

  const submission = await parseWithZod(formData, {
    schema: createAbuseReportSchema(locales).transform(async (data, ctx) => {
      const { reasons, otherReason } = data;
      if (reasons.length === 0 && typeof otherReason !== "string") {
        ctx.addIssue({
          path: ["reasons"],
          code: "custom",
          message: locales.route.abuseReport.noReasons,
        });
        return z.NEVER;
      }
      try {
        const openAbuseReport = await prismaClient.eventAbuseReport.findFirst({
          select: {
            id: true,
          },
          where: {
            event: {
              slug,
            },
            status: "open",
            reporterId: sessionUser.id,
          },
        });
        if (openAbuseReport !== null) {
          ctx.addIssue({
            path: ["reasons"],
            code: "custom",
            message: locales.route.abuseReport.alreadySubmitted,
          });
          return z.NEVER;
        }
        const suggestions =
          await prismaClient.eventAbuseReportReasonSuggestion.findMany({
            where: {
              slug: {
                in: reasons,
              },
            },
          });

        const reasonsForReport: string[] = [];
        for (const suggestion of suggestions) {
          reasonsForReport.push(suggestion.description);
        }
        if (typeof otherReason === "string") {
          reasonsForReport.push(otherReason);
        }

        const report = await createEventAbuseReport({
          reporterId: sessionUser.id,
          slug: slug,
          reasons: reasonsForReport,
        });
        await sendNewReportMailToSupport(report);
      } catch (error) {
        console.error({ error });
        Sentry.captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: ["reasons"],
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
  redirectUrl.searchParams.delete("modal-report");
  return {
    submission: null,
    toast: {
      id: "report-event",
      key: `${new Date().getTime()}`,
      message: locales.route.success.abuseReport,
    },
    redirectUrl: redirectUrl.toString(),
  };
}
