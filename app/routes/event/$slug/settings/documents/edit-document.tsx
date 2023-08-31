import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import { updateDocument } from "./edit-document.server";
import { getEventBySlug } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  documentId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  extension: z.string(),
});

const environmentSchema = z.object({
  eventId: z.string(),
});

export const editDocumentSchema = schema;

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (values.eventId !== environment.eventId) {
    throw "Event id nicht korrekt";
  }
  let title;
  if (values.title !== undefined) {
    if (!values.title.includes("." + values.extension)) {
      title = values.title + "." + values.extension;
    } else {
      title = values.title;
    }
  } else {
    title = null;
  }
  try {
    await updateDocument(values.documentId, {
      title: title,
      description: values.description || null,
    });
  } catch (error) {
    throw "Dokument konnte nicht editiert werden.";
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

  const event = await getEventBySlug(slug);
  invariantResponse(event, "Event not found", { status: 404 });

  await checkOwnershipOrThrow(event, sessionUser);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { eventId: event.id },
  });

  return json(result, { headers: response.headers });
};
