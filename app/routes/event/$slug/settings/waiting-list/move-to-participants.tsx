import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getProfileByUserId } from "~/profile.server";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import {
  connectParticipantToEvent,
  disconnectFromWaitingListOfEvent,
} from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  profileId: z.string(),
});

export const moveToParticipantsSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export type ActionData = PerformMutation<
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
    const profile = await getProfileByUserId(result.data.profileId);
    if (profile !== null) {
      await connectParticipantToEvent(event.id, profile.id);
      await disconnectFromWaitingListOfEvent(event.id, result.data.profileId);
    }
  }
  return json<ActionData>(result, { headers: response.headers });
};