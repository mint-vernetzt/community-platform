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
import { getIsTeamMember } from "../../utils.server";
import { detectLanguage } from "~/root.server";
import {
  type EventRemoveAdminLocales,
  getEventBySlug,
  removeAdminFromEvent,
} from "./remove-admin.server";
import { languageModuleMap } from "~/locales-next/.server/utils";

const schema = z.object({
  profileId: z.string(),
});

export const removeAdminSchema = schema;

const environmentSchema = z.object({
  adminCount: z.number(),
});

const createMutation = (locales: EventRemoveAdminLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (environment.adminCount === 1) {
      throw locales.error.adminCount;
    }

    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/admins/remove-admin"];
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });
  const event = await getEventBySlug(slug);
  invariantResponse(event, locales.error.notFound, { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { adminCount: event._count.admins },
  });

  if (result.success === true) {
    await removeAdminFromEvent(event.id, result.data.profileId);
    if (sessionUser.id === result.data.profileId) {
      const isTeamMember = await getIsTeamMember(event.id, sessionUser.id);
      if (event.published || isTeamMember) {
        return redirect(`/event/${slug}`);
      } else {
        return redirect("/dashboard");
      }
    }
  }
  return json(result);
};
