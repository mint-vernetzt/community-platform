import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { checkIdentityOrThrow } from "../utils.server";
import { getEventBySlug, removeAdminFromEvent } from "./remove-admin.server";

const schema = z.object({
  userId: z.string(),
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

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);
  const slug = getParamValueOrThrow(params, "slug");
  const event = await getEventBySlug(slug);
  invariantResponse(event, "Event not found", { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { adminCount: event._count.admins },
  });

  if (result.success === true) {
    const mode = await deriveEventMode(sessionUser, slug);
    invariantResponse(mode === "admin", "Not privileged", { status: 403 });
    await removeAdminFromEvent(event.id, result.data.profileId);
    if (sessionUser.id === result.data.profileId) {
      return redirect(`/event/${slug}`);
    }
  }
  return json(result, { headers: response.headers });
};
