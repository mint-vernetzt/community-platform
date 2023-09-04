import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { checkIdentityOrThrow } from "../utils.server";
import {
  addAdminToEvent,
  getEventBySlug,
  getProfileById,
} from "./add-admin.server";

const schema = z.object({
  userId: z.string(),
  profileId: z.string(),
});

const environmentSchema = z.object({
  eventSlug: z.string(),
});

export const addAdminSchema = schema;

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const profile = await getProfileById(values.profileId);
  if (profile === null) {
    throw new InputError(
      "Es existiert noch kein Profil unter diesem Namen.",
      "profileId"
    );
  }
  const alreadyAdmin = profile.administeredEvents.some((relation) => {
    return relation.event.slug === environment.eventSlug;
  });
  if (alreadyAdmin) {
    throw new InputError(
      "Das Profil unter diesem Namen ist bereits Administrator:in Eurer Veranstaltung.",
      "profileId"
    );
  }
  return {
    ...values,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);
  const slug = getParamValueOrThrow(params, "slug");

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { eventSlug: slug },
  });

  if (result.success === true) {
    const mode = await deriveEventMode(sessionUser, slug);
    invariantResponse(mode === "admin", "Not privileged", { status: 403 });
    const event = await getEventBySlug(slug);
    invariantResponse(event, "Event not found", { status: 404 });
    await addAdminToEvent(event.id, result.data.profileId);

    return json(
      {
        message: `"${result.data.firstName} ${result.data.lastName}" wurde als Administrator:in hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }
  return json(result, { headers: response.headers });
};
