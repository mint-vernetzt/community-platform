import { LoaderFunction } from "remix";
import { forbidden } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveMode, getEventBySlugOrThrow } from "./utils.server";

type LoaderData = Response;

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const currentUser = await getUserByRequest(request);
  const slug = getParamValueOrThrow(params, "slug");
  const event = await getEventBySlugOrThrow(slug);
  const mode = await deriveMode(event, currentUser);

  if (mode !== "owner" && event.published === false) {
    throw forbidden({ message: "Event not published" });
  }

  const filename = "";
  // TODO: get url parameter filename
  // If null -> download all files from event as zip
  // if !null -> download file with filename from url parameter

  return new Response("TODO: file", {
    status: 200,
    headers: {
      "Content-Type": "TODO: get MIME type of file",
      "Content-Disposition": `filename="/*TODO: If zip -> ${event.name}_Dokumente.zip / else -> ${filename}.fileExtension"`,
    },
  });
};
