import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
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
    const childEvent = await getEventByIdOrThrow(result.data.childEventId);
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
