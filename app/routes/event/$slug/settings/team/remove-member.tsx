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
  getEventBySlug,
  type RemoveEventTeamMemberLocales,
  removeTeamMemberFromEvent,
} from "./remove-member.server";

const schema = z.object({
  profileId: z.string(),
});

export const removeMemberSchema = schema;

const environmentSchema = z.object({
  memberCount: z.number(),
});

const createMutation = (locales: RemoveEventTeamMemberLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (environment.memberCount === 1) {
      throw locales.error.minimum;
    }
    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/team/remove-member"];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const event = await getEventBySlug(slug);
  invariantResponse(event, locales.error.notFound, { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { memberCount: event._count.teamMembers },
  });

  if (result.success === true) {
    await removeTeamMemberFromEvent(event.id, result.data.profileId);
  }
  return { ...result };
};
