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
import { detectLanguage } from "~/root.server";
import i18next from "~/i18next.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";

const i18nNS = ["routes-event-documents-download"] as const;

export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

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
      throw json(
        {
          message: "Das angeforderte Dokument konnte nicht gefunden werden.",
        },
        { status: 500 }
      );
    }
    const escapedDocument = {
      ...document,
      filename: escapeFilenameSpecialChars(document.title || document.filename),
    };
    documents = [escapedDocument];
  }
  const escapedEventName = escapeFilenameSpecialChars(event.name);
  const zipFilename = `${escapedEventName} ${t("zipSuffix")}`;

  const documentResponse = getDownloadDocumentsResponse(
    authClient,
    documents,
    zipFilename
  );
  return documentResponse;
};
