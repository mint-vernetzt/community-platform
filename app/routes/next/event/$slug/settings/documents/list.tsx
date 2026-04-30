import { useEffect, useState } from "react";
import {
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import List from "~/components/next/List";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  getDocumentsOfEvent,
  getEventBySlug,
  removeDocumentFromEvent,
  updateDocumentOfEvent,
} from "./list.server";
import ListItemMaterial from "~/components/next/ListItemMaterial";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Deep, extendSearchParams } from "~/lib/utils/searchParams";
import {
  DOCUMENT_ID_FIELD_NAME,
  EDIT_DOCUMENT_INTENT_VALUE,
  getEditDocumentSchema,
  getRemoveDocumentSchema,
  getSearchDocumentsSchema,
  REMOVE_DOCUMENT_INTENT_VALUE,
  SEARCH_DOCUMENTS_SEARCH_PARAM,
} from "~/storage.shared";
import { parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/documents/list"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { submission, documents } = await getDocumentsOfEvent({
    slug: params.slug,
    searchParams,
  });

  if (documents.length === 0) {
    return redirect(`/next/event/${params.slug}/settings/documents/add`);
  }

  return { locales, submission, documents, event: { slug: params.slug } };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/documents/list"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const formData = await request.formData();

  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(typeof intent === "string", "intent is not defined", {
    status: 400,
  });
  invariantResponse(
    intent === REMOVE_DOCUMENT_INTENT_VALUE ||
      intent === EDIT_DOCUMENT_INTENT_VALUE,
    "unknown intent",
    {
      status: 400,
    }
  );

  if (intent === REMOVE_DOCUMENT_INTENT_VALUE) {
    const submission = await parseWithZod(formData, {
      schema: getRemoveDocumentSchema(),
    });

    if (submission.status !== "success") {
      captureException(submission.error);
      return redirectWithToast(request.url, {
        id: "invite-profile-to-join-event-as-admin-error",
        key: `invite-profile-to-join-event-as-admin-error-${Date.now()}`,
        message: locales.route.errors.removeDocumentFailed,
        level: "negative",
      });
    }

    try {
      await removeDocumentFromEvent({
        eventId: event.id,
        documentId: submission.value[DOCUMENT_ID_FIELD_NAME],
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "invite-profile-to-join-event-as-admin-error",
        key: `invite-profile-to-join-event-as-admin-error-${Date.now()}`,
        message: locales.route.errors.removeDocumentFailed,
        level: "negative",
      });
    }

    const url = new URL(request.url);
    const searchParams = extendSearchParams(url.searchParams, {
      remove: [`overlay-menu-document-${submission.value.documentId}`],
    });

    return redirectWithToast(`${url.pathname}?${searchParams.toString()}`, {
      id: "remove-document-success",
      key: `remove-document-success-${Date.now()}`,
      message: locales.route.success.removeDocument,
      level: "positive",
    });
  } else {
    const submission = await parseWithZod(formData, {
      schema: getEditDocumentSchema(locales.route.validation.edit),
    });

    if (submission.status !== "success") {
      return {
        submission: submission.reply(),
        intent: EDIT_DOCUMENT_INTENT_VALUE,
      };
    }

    try {
      const { documentId, ...updateData } = submission.value;
      await updateDocumentOfEvent({
        documentId: documentId,
        data: updateData,
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "edit-document-error",
        key: `edit-document-error-${Date.now()}`,
        message: locales.route.errors.updateDocumentFailed,
        level: "negative",
      });
    }

    const url = new URL(request.url);
    const searchParams = extendSearchParams(url.searchParams, {
      remove: [`modal-edit-document-${submission.value.documentId}`],
    });

    return redirectWithToast(`${url.pathname}?${searchParams.toString()}`, {
      id: "edit-document-success",
      key: `edit-document-success-${Date.now()}`,
      message: locales.route.success.updateDocument,
      level: "positive",
    });
  }
}

function DocumentsList() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { submission, intent } = actionData ?? {};
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigation = useNavigation();

  const { locales, event } = loaderData;
  const [documents, setDocuments] = useState(loaderData.documents);

  useEffect(() => {
    setDocuments(loaderData.documents);
  }, [loaderData.documents]);

  return (
    <>
      <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
        {locales.route.title}
      </h3>
      <List id="documents-list" hideAfter={4} locales={locales.route.list}>
        <List.Search
          defaultItems={loaderData.documents}
          setValues={setDocuments}
          searchParam={SEARCH_DOCUMENTS_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.list.searchPlaceholder,
          }}
          hideUntil={4}
          label={locales.route.list.searchPlaceholder}
          submission={loaderData.submission}
          schema={getSearchDocumentsSchema()}
        />
        {documents.map((document, index) => {
          return (
            <ListItemMaterial
              key={document.id}
              index={index}
              type={document.mimeType === "application/pdf" ? "pdf" : "image"}
              sizeInMB={document.sizeInMB}
            >
              {/* {document.mimeType !== "application/pdf" ? (
                <ListItemMaterial.Image
                  alt={document.title || document.filename}
                  src="TODO:"
                  blurredSrc="TODO:"
                />
              ) : null} */}
              <ListItemMaterial.Headline>
                {document.title || document.filename}
              </ListItemMaterial.Headline>
              {/* {hasContent(document.credits) && (
                <ListItemMaterial.Subline>
                  © {document.credits}
                </ListItemMaterial.Subline>
              )} */}
              <ListItemMaterial.Controls
                overlayMenuProps={{
                  as: "circle-button",
                  searchParam: `overlay-menu-document-${document.id}`,
                  locales: { close: locales.route.list.overlayMenu },
                }}
              >
                <ListItemMaterial.Controls.Remove
                  documentId={document.id}
                  label={locales.route.list.remove}
                />
                <ListItemMaterial.Controls.EditModal
                  document={{
                    id: document.id,
                    title: document.title,
                    description: document.description,
                  }}
                  lastResult={
                    navigation.state === "idle" &&
                    intent === EDIT_DOCUMENT_INTENT_VALUE
                      ? submission
                      : undefined
                  }
                  modalProps={{
                    searchParam: `modal-edit-document-${document.id}`,
                  }}
                  modalCloseButtonProps={{
                    route: `${location.pathname}?${extendSearchParams(searchParams, { addOrReplace: { [Deep]: "true" } }).toString()}`,
                  }}
                  locales={{
                    ...locales.route.list.editModal,
                    ...locales.route.validation.edit,
                  }}
                />
                <ListItemMaterial.Controls.Edit
                  label={locales.route.list.edit}
                  modalProps={{
                    searchParam: `modal-edit-document-${document.id}`,
                  }}
                />
                <ListItemMaterial.Controls.Download
                  to={`/event/${event.slug}/documents-download?document_id=${document.id}`}
                  label={locales.route.list.download}
                />
              </ListItemMaterial.Controls>
            </ListItemMaterial>
          );
        })}
      </List>
      {documents.length > 1 ? (
        <div className="flex md:justify-end">
          <div className="w-full md:w-fit ">
            <Button
              as="link"
              variant="outline"
              to={`/event/${event.slug}/documents-download`}
              reloadDocument
              fullSize
            >
              {locales.route.list.downloadAll}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default DocumentsList;
