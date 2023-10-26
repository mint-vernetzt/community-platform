import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { updateDocument } from "./edit-document.server";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";

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

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/event/settings/documents/edit-document",
  ]);
  const authClient = createAuthClient(request, response);
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

  return json(result, { headers: response.headers });
};
