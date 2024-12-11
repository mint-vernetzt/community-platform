import type { Document } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { doPersistUpload, parseMultipart } from "~/storage.server";
import { createDocumentOnEvent } from "./utils.server";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";

const schema = z.object({
  uploadKey: z.string(),
  document: z.unknown(),
});

export const uploadDocumentSchema = schema;

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes-event-settings-documents-upload-document",
  ]);
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const parsedData = await parseMultipart(request);
  const { uploadHandlerResponse } = parsedData;
  await doPersistUpload(authClient, "documents", uploadHandlerResponse);
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
    await createDocumentOnEvent(slug, document);
  } catch (error) {
    throw t("error.server");
  }

  return null;
};
