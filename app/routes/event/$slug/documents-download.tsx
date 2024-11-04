import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getDownloadDocumentsResponse } from "~/storage.server";
import { deriveEventMode } from "../utils.server";
import { getDocumentById, getEventBySlug } from "./documents-download.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
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
    throw json({ message: "Event not published" }, { status: 403 });
  }
  const url = new URL(request.url);
  const documentId = url.searchParams.get("document_id");
  let documents;
  if (documentId === null) {
    documents = event.documents.map((relation, index) => {
      if (
        event.documents.some((otherRelation) => {
          return (
            (relation.document.title !== null &&
              relation.document.title === otherRelation.document.title) ||
            relation.document.filename === otherRelation.document.filename
          );
        })
      ) {
        return {
          ...relation.document,
          title: `${relation.document.title} (${index + 1})`,
          filename: `${relation.document.filename} (${index + 1})`,
        };
      }
      return relation.document;
    });
  } else {
    const document = await getDocumentById(documentId);
    if (document === null) {
      throw json(
        {
          message: "Das angeforderte Dokument konnte nicht gefunden werden.",
        },
        { status: 500 }
      );
    }
    documents = [document];
  }
  const zipFilename = `${event.name}_Dokumente.zip`;
  const documentResponse = getDownloadDocumentsResponse(
    authClient,
    documents,
    zipFilename
  );
  return documentResponse;
};
