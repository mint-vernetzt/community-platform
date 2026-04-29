import { z } from "zod";

export const SEARCH_DOCUMENTS_SEARCH_PARAM = "search_documents";
export const DOCUMENT_ID = "documentId";

export const DELETE_DOCUMENT_INTENT = "delete-document";
export const EDIT_DOCUMENT_INTENT = "edit-document";

export function getSearchDocumentsSchema() {
  return z.object({
    [SEARCH_DOCUMENTS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}
