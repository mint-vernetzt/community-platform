import { ActionFunction } from "remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
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

export const action: ActionFunction = async (args) => {
  const { request } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");
  const currentUser = await getUserByRequestOrThrow(request);
  await checkIdentityOrThrow(request, currentUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkOwnershipOrThrow(event, currentUser);
    await checkSameEventOrThrow(request, event.id);
    await updateParticipantLimit(event.id, result.data.participantLimit);
  }
  return result;
};
