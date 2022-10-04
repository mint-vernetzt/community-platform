import JSZip from "jszip";
import { LoaderFunction } from "remix";
import { badRequest, forbidden } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { download } from "~/storage.server";
import { deriveMode, getEventBySlugOrThrow } from "../utils.server";

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

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  let filename = url.searchParams.get("filename");
  let file;
  let contentType;
  if (path !== null) {
    if (filename === null) {
      throw badRequest({
        message:
          "Either pass - path - and - filename - as url parameter to download a single document or pass nothing to download all documents of the event as zip.",
      });
    }
    const blob = await download(path);
    file = await blob.arrayBuffer();
    contentType = blob.type;
  } else {
    const zip = new JSZip();
    const files = await Promise.all(
      event.documents.map(async (item) => {
        const blob = await download(item.document.path);
        let file = {
          name: item.document.title || item.document.filename,
          content: await blob.arrayBuffer(),
        };
        return file;
      })
    );
    files.map((file) => {
      zip.file(file.name, file.content);
      return null;
    });
    file = await zip.generateAsync({ type: "arraybuffer" });
    contentType = "application/zip";
    filename = `${event.name}_Dokumente.zip`;
  }

  // TODO: Check for missing headers
  return new Response(file, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
};
