import { ActionFunction } from "remix";
import { makeDomainFunction } from "remix-domains";
import { PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
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

export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);

  await checkIdentityOrThrow(request, currentUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { eventId: event.id },
  });

  return result;
};
