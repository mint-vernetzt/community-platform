import { redirect, type LoaderFunctionArgs } from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getDownloadDocumentsResponse } from "~/storage.server";
import { deriveEventMode } from "../utils.server";
import { getDocumentById, getEventBySlug } from "./documents-download.server";
import { detectLanguage } from "~/i18n.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/documents-download"];

  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const slug = getParamValueOrThrow(params, "slug");
  const event = await getEventBySlug(slug);
  invariantResponse(event, "Event not found", { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);

  if (mode !== "admin" && event.published === false) {
    invariantResponse(false, "Event not published", { status: 403 });
  }
  const url = new URL(request.url);
  const documentId = url.searchParams.get("document_id");
  let documents;
  if (documentId === null) {
    documents = event.documents.map((relation, index) => {
      const escapedFilename = escapeFilenameSpecialChars(
        relation.document.title || relation.document.filename
      );
      if (
        event.documents.some((otherRelation) => {
          return (
            relation.document.id !== otherRelation.document.id &&
            relation.document.filename === otherRelation.document.filename
          );
        })
      ) {
        return {
          ...relation.document,
          filename: `${index + 1}_${escapedFilename}`,
        };
      } else {
        return {
          ...relation.document,
          filename: escapedFilename,
        };
      }
    });
  } else {
    const document = await getDocumentById(documentId);
    if (document === null) {
      invariantResponse(false, "Document not found", { status: 500 });
    }
    const escapedDocument = {
      ...document,
      filename: escapeFilenameSpecialChars(document.title || document.filename),
    };
    documents = [escapedDocument];
  }
  const escapedEventName = escapeFilenameSpecialChars(event.name);
  const zipFilename = `${escapedEventName} ${locales.zipSuffix}`;

  const documentResponse = getDownloadDocumentsResponse(
    authClient,
    documents,
    zipFilename
  );
  return documentResponse;
};
