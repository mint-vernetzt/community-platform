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
import { disconnectDocumentFromEvent } from "./utils.server";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";

const schema = z.object({
  documentId: z.string(),
});

export const deleteDocumentSchema = schema;

const createMutation = (t: TFunction) => {
  return makeDomainFunction(schema)(async (values) => {
    try {
      await disconnectDocumentFromEvent(values.documentId);
    } catch (error) {
      throw t("error.delete");
    }
    return values;
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const t = await i18next.getFixedT(request, [
    "routes/event/settings/documents/delete-document",
  ]);
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
  });

  return json(result, { headers: response.headers });
};
