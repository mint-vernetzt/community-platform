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
import { addChildEventRelationOrThrow, getEventById } from "./utils.server";

// TODO: Validate start and end time
const schema = z.object({
  eventId: z.string(),
  childEventId: z.string().min(1),
});

export const addChildSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const event = await getEventById(values.eventId);
  invariantResponse(event, "Event not found", { status: 404 });
  if (values.childEventId !== undefined) {
    const childEvent = await getEventById(values.childEventId);
    invariantResponse(childEvent, "Child event not found", { status: 404 });
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
  }
  return values;
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");

  const result = await performMutation({ request, schema, mutation });

  const eventId =
    "data" in result ? result.data.eventId : result.values.eventId;
  const childEventId =
    "data" in result ? result.data.childEventId : result.values.childEventId;
  const event = await getEventById(eventId);
  invariantResponse(event, "Event not found", { status: 404 });
  const childEvent = await getEventById(childEventId);
  invariantResponse(childEvent, "Child event not found", { status: 404 });
  if (result.success === true) {
    const mode = await deriveEventMode(sessionUser, slug);
    invariantResponse(mode === "admin", "Not privileged", { status: 403 });
    await checkSameEventOrThrow(request, event.id);
    await addChildEventRelationOrThrow(event.id, result.data.childEventId);
    return json(
      {
        message: `Die Veranstaltung "${childEvent.name}" ist jetzt Eurer Veranstaltung zugehörig.`,
      },
      { headers: response.headers }
    );
  }
  return json(result, { headers: response.headers });
};
