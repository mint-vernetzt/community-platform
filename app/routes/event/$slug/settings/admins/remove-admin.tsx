import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { getIsTeamMember } from "../../utils.server";
import {
  type RemoveEventAdminLocales,
  getEventBySlug,
  removeAdminFromEvent,
} from "./remove-admin.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

const schema = z.object({
  profileId: z.string().trim().uuid(),
});

export const removeAdminSchema = schema;

const environmentSchema = z.object({
  adminCount: z.number(),
});

const createMutation = (locales: RemoveEventAdminLocales) => {
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
  return { ...result };
};
