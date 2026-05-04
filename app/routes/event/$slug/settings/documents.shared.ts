import { z } from "zod";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type EventDocumentsSettingsLocales } from "./documents.server";

export const DOCUMENT_DESCRIPTION_MAX_LENGTH = 80;

export const createEditDocumentSchema = (
  locales: EventDocumentsSettingsLocales
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

export const disconnectAttachmentSchema = z.object({
  id: z.string().trim().uuid(),
});
