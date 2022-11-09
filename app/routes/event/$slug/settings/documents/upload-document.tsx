import { Document } from "@prisma/client";
import { ActionFunction } from "remix";
import { PerformMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { doPersistUpload, parseMultipart } from "~/storage.server";
import { getEventBySlugOrThrow } from "../../utils.server";
import { checkOwnershipOrThrow } from "../utils.server";
import { createDocumentOnEvent } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  uploadKey: z.string(),
  document: z.unknown(),
});

export const uploadDocumentSchema = schema;

// TODO: wrap with performMutation + makeDomainFunction
export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  const parsedData = await parseMultipart(request, "documents");

  const { uploadHandlerResponse, formData } = parsedData;
  const eventId = formData.get("eventId") as string;
  if (eventId !== event.id) {
    throw "Event id nicht korrekt";
  }

  await doPersistUpload("documents", uploadHandlerResponse);

  const document: Pick<
    Document,
    "filename" | "path" | "extension" | "sizeInMB" | "mimeType"
  > = {
    filename: uploadHandlerResponse.filename,
    path: uploadHandlerResponse.path,
    extension: uploadHandlerResponse.extension,
    sizeInMB:
      Math.round((uploadHandlerResponse.sizeInBytes / 1024 / 1024) * 100) / 100,
    mimeType: uploadHandlerResponse.mimeType,
  };

  try {
    await createDocumentOnEvent(event.id, document);
  } catch (error) {
    throw "Dokument konnte nicht in der Datenbank gespeichert werden.";
  }

  return null;
};
