import { Document } from "@prisma/client";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { ActionFunction, json } from "remix";
import { PerformMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
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

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, sessionUser);

  const parsedData = await parseMultipart(request);

  const { uploadHandlerResponse, formData } = parsedData;
  const eventId = formData.get("eventId") as string;
  if (eventId !== event.id) {
    throw "Event id nicht korrekt";
  }

  await doPersistUpload(supabaseClient, "documents", uploadHandlerResponse);

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

  return json({ headers: response.headers });
};
