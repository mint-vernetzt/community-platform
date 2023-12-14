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
import {
  getEventBySlug,
  updateParentEventRelationOrThrow,
} from "./utils.server";

const schema = z.object({
  parentEventId: z.string().optional(),
});

export const setParentSchema = schema;

const environmentSchema = z.object({
  slug: z.string(),
});

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const event = await getEventBySlug(environment.slug);
  if (event === null) {
    throw "Die aktuelle Veranstaltung konnte nicht gefunden werden.";
  }
  let parentEventName;
  if (values.parentEventId !== undefined) {
    const parentEvent = await getEventBySlug(values.parentEventId);
    if (parentEvent === null) {
      throw "Die Rahmenveranstaltung konnte nicht gefunden werden.";
    }
    const parentStartTime = new Date(parentEvent.startTime).getTime();
    const parentEndTime = new Date(parentEvent.endTime).getTime();
    const eventStartTime = new Date(event.startTime).getTime();
    const eventEndTime = new Date(event.endTime).getTime();
    if (parentStartTime > eventStartTime || parentEndTime < eventEndTime) {
      throw new InputError(
        "Deine Veranstaltung liegt nicht im Zeitraum der Rahmenveranstaltung.",
        "parentEventId"
      );
    }
    parentEventName = parentEvent.name;
  }
  return { ...values, parentEventName: parentEventName };
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { slug: slug },
  });

  if (result.success === true) {
    await updateParentEventRelationOrThrow(slug, result.data.parentEventId);
    if (
      result.data.parentEventId !== undefined &&
      result.data.parentEventName !== undefined
    ) {
      return json(
        {
          message: `Die Veranstaltung "${result.data.parentEventName}" ist jetzt Rahmenveranstaltung für Eure Veranstaltung.`,
        },
        { headers: response.headers }
      );
    } else {
      return json(
        {
          message: `Die aktuelle Rahmenversanstaltung ist jetzt nicht mehr Rahmenveranstaltung deiner Veranstaltung.`,
        },
        { headers: response.headers }
      );
    }
  }
  return json(result, { headers: response.headers });
};
