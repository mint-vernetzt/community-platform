import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { checkSameEventOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import { cancelEvent, getEventById } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  cancel: z.boolean(),
});

export const cancelSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
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

  if (result.success === true) {
    const event = await getEventById(result.data.eventId);
    invariantResponse(event, "Event not found", { status: 404 });
    await checkOwnershipOrThrow(event, sessionUser);
    await checkSameEventOrThrow(request, event.id);
    await cancelEvent(event.id, result.data.cancel);
  }
  return json(result, { headers: response.headers });
};
