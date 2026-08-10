import { type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getDownloadDocumentsResponse } from "~/storage.server";
import { getEventBySlug } from "./documents-download.server";
import { detectLanguage } from "~/i18n.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";
import { languageModuleMap } from "~/locales/.server";
import { getIsMember } from "./detail.server";
import { getIsParticipant } from "./utils.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/documents-download"];

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  const slug = getParamValueOrThrow(params, "slug");
  const event = await getEventBySlug(slug);
  invariantResponse(event, "Event not found", { status: 404 });

  if (event.openForRegistration === false || event.published === false) {
    const isMember = await getIsMember(sessionUser, event);
    const isParticipant = await getIsParticipant(event.id, sessionUser?.id);
    invariantResponse(isMember || isParticipant, "Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const documentId = url.searchParams.get("document_id");
  let documents;
  if (documentId === null) {
    documents = event.documents.map((relation, index) => {
      let escapedFilename = escapeFilenameSpecialChars(
        relation.document.title || relation.document.filename
      );
      if (escapedFilename.endsWith(relation.document.extension) === false) {
        escapedFilename = `${escapedFilename}.${relation.document.extension}`;
      }
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
    let document = null;

    console.log("Event documents:", event.documents);
    console.log("Searching for document with ID:", documentId);
    for (const relation of event.documents) {
      if (relation.document.id === documentId) {
        document = relation.document;
      }
    }
    invariantResponse(document, "Document not found", { status: 404 });

    let escapedFilename = escapeFilenameSpecialChars(
      document.title || document.filename
    );
    if (escapedFilename.endsWith(document.extension) === false) {
      escapedFilename = `${escapedFilename}.${document.extension}`;
    }
    const escapedDocument = {
      ...document,
      filename: escapedFilename,
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
}
