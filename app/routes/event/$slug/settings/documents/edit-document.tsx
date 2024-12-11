import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { updateDocument } from "./edit-document.server";
import i18next from "~/i18next.server";
import { type TFunction } from "i18next";
import { detectLanguage } from "~/root.server";

const schema = z.object({
  documentId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  extension: z.string(),
});

export const editDocumentSchema = schema;

const createMutation = (t: TFunction) => {
  return makeDomainFunction(schema)(async (values) => {
    let title;
    if (values.title !== undefined) {
      if (!values.title.includes("." + values.extension)) {
        title = values.title + "." + values.extension;
      } else {
        title = values.title;
      }
    } else {
      title = null;
    }
    try {
      await updateDocument(values.documentId, {
        title: title,
        description: values.description || null,
      });
    } catch (error) {
      throw t("error.server");
    }
    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes-event-settings-documents-edit-document",
  ]);
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
  });

  if (result.success) {
    const currentUrl = new URL(request.url);
    currentUrl.searchParams.delete(`modal-${result.data.documentId}`);
    const redirectUrl = new URL(
      `${process.env.COMMUNITY_BASE_URL}/event/${slug}/settings/documents`
    );
    return redirect(`${redirectUrl.pathname}${currentUrl.search}`);
  }

  return json(result);
};
