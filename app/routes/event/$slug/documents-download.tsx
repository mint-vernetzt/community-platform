import { LoaderFunction } from "@remix-run/node";
import { forbidden, serverError } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { getDocumentById } from "~/document.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getDownloadDocumentsResponse } from "~/storage.server";
import { deriveMode, getEventBySlugOrThrow } from "./utils.server";

type LoaderData = Response;

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;

  const currentUser = await getUserByRequest(request);
  const slug = getParamValueOrThrow(params, "slug");
  const event = await getEventBySlugOrThrow(slug);
  const mode = await deriveMode(event, currentUser);

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
  const response = getDownloadDocumentsResponse(documents, zipFilename);
  return response;
};
