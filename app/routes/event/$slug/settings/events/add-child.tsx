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
import { addChildEventRelationOrThrow } from "./utils.server";

// TODO: Validate start and end time
const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  childEventId: z.string().min(1),
});

export const addChildSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const event = await getEventByIdOrThrow(values.eventId);
  if (values.childEventId !== undefined) {
    const childEvent = await getEventByIdOrThrow(values.childEventId);
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

  const eventId =
    "data" in result ? result.data.eventId : result.values.eventId;
  const childEventId =
    "data" in result ? result.data.childEventId : result.values.childEventId;
  const event = await getEventByIdOrThrow(eventId);
  const childEvent = await getEventByIdOrThrow(childEventId);
  if (result.success === true) {
    await checkOwnershipOrThrow(event, sessionUser);
    await checkSameEventOrThrow(request, event.id);
    await addChildEventRelationOrThrow(event.id, result.data.childEventId);
    return json<SuccessActionData>(
      {
        message: `Die Veranstaltung "${childEvent.name}" ist jetzt Eurer Veranstaltung zugehörig.`,
      },
      { headers: response.headers }
    );
  }
  return json<FailureActionData>(result, { headers: response.headers });
};
