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
import { checkSameEventOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, getProfileById } from "../utils.server";
import { connectSpeakerProfileToEvent, getEventById } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  id: z.string(),
});

export const addSpeakerSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const profile = await getProfileById(values.id);
  if (profile === null) {
    throw new InputError(
      "Es existiert noch kein Profil unter diesem Namen.",
      "id"
    );
  }
  const alreadyMember = profile.contributedEvents.some((entry) => {
    return entry.event.id === values.eventId;
  });
  if (alreadyMember) {
    throw new InputError(
      "Das Profil unter diesem Namen ist bereits Speaker Eurer Veranstaltung.",
      "id"
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

  const result = await performMutation({ request, schema, mutation });

  if (result.success) {
    const event = await getEventById(result.data.eventId);
    invariantResponse(event, "Event not found", { status: 404 });
    const mode = await deriveEventMode(sessionUser, slug);
    invariantResponse(mode === "admin", "Not privileged", { status: 403 });
    await checkSameEventOrThrow(request, event.id);
    const profile = await getProfileById(result.data.id);
    if (profile !== null) {
      await connectSpeakerProfileToEvent(result.data.eventId, profile.id);
    }
    return json(
      {
        message: `Das Profil mit dem Namen "${result.data.firstName} ${result.data.lastName}" wurde als Speaker:in hinzugefügt.`,
      },
      { headers: response.headers }
    );
  }

  return json(result, { headers: response.headers });
};
