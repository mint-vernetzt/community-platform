import { createServerClient } from "@supabase/auth-helpers-remix";
import { ActionFunction, json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import {
  getNumberOfParticipants,
  updateParticipantLimit,
} from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  participantLimit: z.number().min(1, "Greater 0").optional(),
});

export const setParticipantLimitSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const numberOfParticipants = await getNumberOfParticipants(values.eventId);
  if (
    values.participantLimit !== undefined &&
    values.participantLimit > 0 &&
    values.participantLimit < numberOfParticipants
  ) {
    throw new InputError(
      "Limit must be at least equal to current number of participants",
      "participantLimit"
    );
  }
  return values;
});

export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();
  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );
  await checkFeatureAbilitiesOrThrow(supabaseClient, "events");
  const sessionUser = await getSessionUserOrThrow(supabaseClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkOwnershipOrThrow(event, sessionUser);
    await checkSameEventOrThrow(request, event.id);
    await updateParticipantLimit(event.id, result.data.participantLimit);
  }
  return json<ActionData>(result, { headers: response.headers });
};
