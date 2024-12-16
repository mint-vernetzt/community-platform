import type { ActionFunctionArgs } from "@remix-run/node";
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
import {
  disconnectOrganizationFromEvent,
  getEventBySlug,
} from "./utils.server";

const schema = z.object({
  organizationId: z.string(),
});

export const removeOrganizationSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "event/$slug/settings/organizations/remove-organization"
    ];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, locales.error.notFound, { status: 404 });
    await disconnectOrganizationFromEvent(event.id, result.data.organizationId);
  }
  return { ...result };
};
