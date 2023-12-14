import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { getProfileById } from "../utils.server";
import { connectSpeakerProfileToEvent, getEventBySlug } from "./utils.server";

const schema = z.object({
  profileId: z.string(),
});

export const addSpeakerSchema = schema;

const environmentSchema = z.object({
  eventSlug: z.string(),
});

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
  const alreadySpeaker = profile.contributedEvents.some((entry) => {
    return entry.event.slug === environment.eventSlug;
  });
  if (alreadySpeaker) {
    throw new InputError(
      "Das Profil unter diesem Namen ist bereits Speaker Eurer Veranstaltung.",
      "profileId"
    );
  }
  return {
    ...values,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: {
      eventSlug: slug,
    },
  });

  if (result.success) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, "Event not found", { status: 404 });
    await connectSpeakerProfileToEvent(event.id, result.data.profileId);
    return json(
      {
        message: `Das Profil mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde als Speaker:in hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }

  return json(result, { headers: response.headers });
};
