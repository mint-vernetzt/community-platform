import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import { disconnectDocumentFromEvent } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  documentId: z.string(),
});

const environmentSchema = z.object({
  eventId: z.string(),
});

export const deleteDocumentSchema = schema;

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (values.eventId !== environment.eventId) {
    throw "Event id nicht korrekt";
  }
  try {
    await disconnectDocumentFromEvent(values.documentId);
  } catch (error) {
    throw "Dokument konnte nicht aus der Datenbank gelöscht werden.";
  }
  return values;
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;

  const response = new Response();

  const authClient = createAuthClient(request, response);

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);

  await checkIdentityOrThrow(request, sessionUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, sessionUser);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { eventId: event.id },
  });

  return json(result, { headers: response.headers });
};
