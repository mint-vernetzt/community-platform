import { z } from "zod";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type ProjectAttachmentSettingsLocales } from "./attachments.server";
import { documentSchema, imageSchema } from "~/storage.shared";

export const createDocumentUploadSchema = (
  locales: ProjectAttachmentSettingsLocales
) => z.object({ ...documentSchema(locales) });

export const createImageUploadSchema = (
  locales: ProjectAttachmentSettingsLocales
) => z.object({ ...imageSchema(locales) });

export const DOCUMENT_DESCRIPTION_MAX_LENGTH = 80;

export const createEditDocumentSchema = (
  locales: ProjectAttachmentSettingsLocales
) =>
  z.object({
    id: z.string().trim().uuid(),
    title: z
      .string()
      .trim()
      .optional()
      .transform((value) =>
        typeof value === "undefined" || value === "" ? null : value
      ),
    description: z
      .string()
      .trim()
      .max(
        DOCUMENT_DESCRIPTION_MAX_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.document.description.max,
          {
            max: DOCUMENT_DESCRIPTION_MAX_LENGTH,
          }
        )
      )
      .optional()
      .transform((value) =>
        typeof value === "undefined" || value === "" ? null : value
      ),
  });

export const IMAGE_DESCRIPTION_MAX_LENGTH = 80;
export const IMAGE_CREDITS_MAX_LENGTH = 80;

export const createEditImageSchema = (
  locales: ProjectAttachmentSettingsLocales
) =>
  z.object({
    id: z.string().trim().uuid(),
    title: z
      .string()
      .trim()
      .optional()
      .transform((value) =>
        typeof value === "undefined" || value === "" ? null : value
      ),
    description: z
      .string()
      .trim()
      .max(
        IMAGE_DESCRIPTION_MAX_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.image.description.max,
          {
            max: IMAGE_DESCRIPTION_MAX_LENGTH,
          }
        )
      )
      .optional()
      .transform((value) =>
        typeof value === "undefined" || value === "" ? null : value
      ),
    credits: z
      .string()
      .trim()
      .max(
        IMAGE_CREDITS_MAX_LENGTH,
        insertParametersIntoLocale(locales.route.validation.image.credits.max, {
          max: IMAGE_CREDITS_MAX_LENGTH,
        })
      )
      .optional()
      .transform((value) =>
        typeof value === "undefined" || value === "" ? null : value
      ),
  });

export const disconnectAttachmentSchema = z.object({
  id: z.string().trim().uuid(),
});
