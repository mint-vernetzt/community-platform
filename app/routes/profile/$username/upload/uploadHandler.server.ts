import { unstable_parseMultipartFormData, UploadHandler } from "remix";
import { serverError } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { prismaClient } from "~/prisma";
import { getPublicURL } from "~/storage.server";
import { supabaseAdmin } from "~/supabase";
import { createHashFromString, stream2buffer } from "~/utils.server";

const UPLOAD_TYPES: Readonly<String[]> = ["avatar", "background"];

const EXTENSION_REGEX = /(?:\.([^.]+))?$/;
function getExtensionFromFilename(filename: string) {
  const result = EXTENSION_REGEX.exec(filename);
  return result !== null ? result[1] : "unknown";
}

function generatePathName(filename: string, hash: string, name: string) {
  const extension = getExtensionFromFilename(filename);
  return `${hash.substring(0, 2)}/${hash.substring(2)}/${name}.${extension}`;
}

const uploadHandler: UploadHandler = async ({ name, stream, filename }) => {
  // Don't process stream
  if (!UPLOAD_TYPES.includes(name)) {
    stream.resume();
    return;
  }

  const buffer = await stream2buffer(stream);
  const hash = await createHashFromString(buffer.toString());
  const path = generatePathName(filename, hash, name);
  const { data, error } = await persistUpload(path, buffer);
  validatePersistence(error, data, path);

  return path;
};

export const upload = async (request: Request) => {
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const name = ["avatar", "background"].filter((name) => formData.has(name))[0];
  const path = formData.get(name);

  const sessionUser = await getUserByRequest(request);
  if (name !== undefined && path !== null && sessionUser !== null) {
    await prismaClient.profile.update({
      where: {
        id: sessionUser.id,
      },
      data: {
        [name]: path,
      },
    });
  }

  return formData;
};

function validatePersistence(error: any, data: any, path: string) {
  if (error || data === null) {
    throw serverError({ message: "Hochladen fehlgeschlagen." });
  }

  if (getPublicURL(path) === null) {
    throw serverError({
      message: "Die angefragte URL konnte nicht gefunden werden.",
    });
  }
}

async function persistUpload(path: string, buffer: Buffer) {
  return await supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
    .from("images")
    .upload(path, buffer, {
      upsert: true,
    });
}
