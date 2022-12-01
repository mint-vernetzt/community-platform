import { createServerClient } from "@supabase/auth-helpers-remix";
import { ActionFunction, json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
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

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(supabaseClient);

  await checkIdentityOrThrow(request, sessionUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, sessionUser);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { eventId: event.id },
  });

  return json<ActionData>(result, { headers: response.headers });
};
