import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { addChildEventRelationOrThrow, getEventBySlug } from "./utils.server";

// TODO: Validate start and end time
const schema = z.object({
  childEventId: z.string().min(1),
});

export const addChildSchema = schema;

const environmentSchema = z.object({
  slug: z.string(),
});

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const event = await getEventBySlug(environment.slug);
  if (event === null) {
    throw "Die Rahmenveranstaltung konnte nicht gefunden werden.";
  }
  const childEvent = await getEventBySlug(values.childEventId);
  if (childEvent === null) {
    throw "Die zugehörige Veranstaltung konnte nicht gefunden werden.";
  }
  const childStartTime = new Date(childEvent.startTime).getTime();
  const childEndTime = new Date(childEvent.endTime).getTime();
  const eventStartTime = new Date(event.startTime).getTime();
  const eventEndTime = new Date(event.endTime).getTime();
  if (childStartTime < eventStartTime || childEndTime > eventEndTime) {
    throw new InputError(
      "Die zugehörige Veranstaltung liegt nicht im Zeitraum deiner Veranstaltung.",
      "childEventId"
    );
  }
  return { ...values, childEventName: childEvent.name };
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { slug: slug },
  });

  if (result.success === true) {
    await addChildEventRelationOrThrow(slug, result.data.childEventId);
    return json({
      message: `Die Veranstaltung "${result.data.childEventName}" ist jetzt Eurer Veranstaltung zugehörig.`,
    });
  }
  return json(result);
};
