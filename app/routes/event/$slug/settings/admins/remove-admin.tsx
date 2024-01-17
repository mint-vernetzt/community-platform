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
import { getEventBySlug, removeAdminFromEvent } from "./remove-admin.server";

const schema = z.object({
  profileId: z.string(),
});

export const removeAdminSchema = schema;

const environmentSchema = z.object({
  adminCount: z.number(),
});

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (environment.adminCount === 1) {
    throw "Es muss immer eine:n Administrator:in geben. Bitte füge zuerst jemand anderen als Administrator:in hinzu.";
  }

  return values;
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const { authClient, response } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  const event = await getEventBySlug(slug);
  invariantResponse(event, "Event not found", { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation,
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
  return json(result, { headers: response.headers });
};
