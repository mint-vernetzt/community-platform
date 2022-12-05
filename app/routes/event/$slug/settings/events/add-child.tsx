import { ActionFunction } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import { addChildEventRelationOrThrow } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  childEventId: z.string().min(1),
});

export const addChildSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
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
    await addChildEventRelationOrThrow(event.id, result.data.childEventId);
  }
  return result;
};
