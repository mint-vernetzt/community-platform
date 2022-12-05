import { ActionFunction } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
import { updateDocument } from "~/document.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";

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
