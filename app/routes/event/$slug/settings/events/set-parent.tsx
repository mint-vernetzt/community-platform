import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import { updateParentEventRelationOrThrow } from "./utils.server";

// TODO: Validate start and end time
const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  parentEventId: z.string().optional(),
});

export const setParentSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const event = await getEventByIdOrThrow(values.eventId);
  if (values.parentEventId !== undefined) {
    const parentEvent = await getEventByIdOrThrow(values.parentEventId);
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
  }
  return values;
});

export const action = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({ request, schema, mutation });
  const eventId =
    "data" in result ? result.data.eventId : result.values.eventId;
  const parentEventId =
    "data" in result ? result.data.parentEventId : result.values.parentEventId;
  let parentEvent;
  const event = await getEventByIdOrThrow(eventId);
  if (parentEventId !== undefined) {
    parentEvent = await getEventByIdOrThrow(parentEventId);
  }
  if (result.success === true) {
    await checkOwnershipOrThrow(event, sessionUser);
    await checkSameEventOrThrow(request, event.id);
    await updateParentEventRelationOrThrow(event.id, result.data.parentEventId);
    if (parentEvent !== undefined) {
      return json(
        {
          message: `Die Veranstaltung "${parentEvent.name}" ist jetzt Rahmenveranstaltung für Eure Veranstaltung.`,
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
