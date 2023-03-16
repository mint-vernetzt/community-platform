import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
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

export type SuccessActionData = {
  message: string;
};

export type FailureActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkOwnershipOrThrow(event, sessionUser);
    await checkSameEventOrThrow(request, event.id);
    await updateParentEventRelationOrThrow(event.id, result.data.parentEventId);
    if (result.data.parentEventId !== undefined) {
      const parentEvent = await getEventByIdOrThrow(result.data.parentEventId);
      return json<SuccessActionData>(
        {
          message: `Die Veranstaltung "${parentEvent.name}" ist jetzt Rahmenveranstaltung für Eure Veranstaltung.`,
        },
        { headers: response.headers }
      );
    } else {
      return json<SuccessActionData>(
        {
          message: `Die aktuelle Rahmenversanstaltung ist jetzt nicht mehr Rahmenveranstaltung deiner Veranstaltung.`,
        },
        { headers: response.headers }
      );
    }
  }
  return json<FailureActionData>(result, { headers: response.headers });
};
