import type { ActionFunctionArgs } from "react-router";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { type DeleteEventDocumentLocales } from "./delete-document.server";
import { disconnectDocumentFromEvent } from "./utils.server";

const schema = z.object({
  documentId: z.string(),
});

export const deleteDocumentSchema = schema;

const createMutation = (locales: DeleteEventDocumentLocales) => {
  return makeDomainFunction(schema)(async (values) => {
    try {
      await disconnectDocumentFromEvent(values.documentId);
    } catch (error) {
      console.error({ error });
      throw locales.error.delete;
    }
    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "event/$slug/settings/documents/delete-document"
    ];
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
  });

  return { ...result };
};
