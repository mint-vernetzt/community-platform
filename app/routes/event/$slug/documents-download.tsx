import type { DataFunctionArgs } from "@remix-run/node";
import { forbidden, serverError } from "remix-utils";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { getDocumentById } from "~/document.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getDownloadDocumentsResponse } from "~/storage.server";
import { deriveMode, getEventBySlugOrThrow } from "./utils.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const event = await getEventBySlugOrThrow(slug);
  const mode = await deriveMode(event, sessionUser);

  if (mode !== "owner" && event.published === false) {
    throw forbidden({ message: "Event not published" });
  }
  const url = new URL(request.url);
  const documentId = url.searchParams.get("document_id");
  let documents;
  if (documentId === null) {
    documents = event.documents.map((wrapper) => {
      return wrapper.document;
    });
  } else {
    const document = await getDocumentById(documentId);
    if (document === null) {
      throw serverError({
        message: "Das angeforderte Dokument konnte nicht gefunden werden.",
      });
    }
    documents = [document];
  }
  const zipFilename = `${event.name}_Dokumente.zip`;
  const documentResponse = getDownloadDocumentsResponse(
    authClient,
    response.headers,
    documents,
    zipFilename
  );
  return documentResponse;
};
