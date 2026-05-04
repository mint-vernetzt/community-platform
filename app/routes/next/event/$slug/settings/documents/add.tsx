import { parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import {
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import {
  getUploadDocumentSchema,
  UPLOAD_DOCUMENT_INTENT_VALUE,
} from "~/storage.shared";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { uploadDocumentToEvent } from "./add.server";
import { getEventBySlug } from "./list.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/documents/add"];

  return { locales };
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
    languageModuleMap[language]["next/event/$slug/settings/documents/add"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const formData = await request.formData();

  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(typeof intent === "string", "intent is not defined", {
    status: 400,
  });
  invariantResponse(intent === UPLOAD_DOCUMENT_INTENT_VALUE, "unknown intent", {
    status: 400,
  });

  const submission = await parseWithZod(formData, {
    schema: getUploadDocumentSchema(locales.route.validation),
  });

  if (submission.status !== "success") {
    captureException(submission.error);
    return redirectWithToast(request.url, {
      id: "upload-document-error",
      key: `upload-document-error-${Date.now()}`,
      message: locales.route.errors.uploadDocumentFailed,
      level: "negative",
    });
  }

  try {
    await uploadDocumentToEvent({
      authClient,
      slug: params.slug,
      file: submission.value.file,
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "upload-document-error",
      key: `upload-document-error-${Date.now()}`,
      message: locales.route.errors.uploadDocumentFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "upload-document-success",
    key: `upload-document-success-${Date.now()}`,
    message: locales.route.success.documentAdded,
    level: "positive",
  });
}

function DocumentsList() {
  const loaderData = useLoaderData<typeof loader>();

  const { locales } = loaderData;

  return <></>;
}

export default DocumentsList;
