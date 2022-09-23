import { unstable_parseMultipartFormData, UploadHandler } from "remix";
import { serverError } from "remix-utils";
import { prismaClient } from "~/prisma";
import { getPublicURL } from "~/storage.server";
import { supabaseAdmin } from "~/supabase";
import { createHashFromString, stream2buffer } from "~/utils.server";
import { uploadKeys } from "./schema";

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
  if (!uploadKeys.includes(name)) {
    stream.resume();
    return;
  }

  const buffer = await stream2buffer(stream);
  const hash = await createHashFromString(buffer.toString());
  const path = generatePathName(filename, hash, name);

  // Only string or File can be returned
  // Is there a better solution than JSON?
  return JSON.stringify({ buffer, path });
};

async function persistUpload(path: string, buffer: Buffer, bucketName: string) {
  return await supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
    // How to pass another bucket name
    .from(bucketName)
    .upload(path, buffer, {
      upsert: true,
    });
}

export async function updateUserProfileImage(
  id: string,
  name: string,
  path: string
) {
  return await prismaClient.profile.update({
    where: {
      id,
    },
    data: {
      [name]: path,
      updatedAt: new Date(),
    },
  });
}

export async function updateOrganizationProfileImage(
  slug: string,
  name: string,
  path: string
) {
  return await prismaClient.organization.update({
    where: {
      slug: slug,
    },
    data: {
      [name]: path,
    },
  });
}

export const upload = async (request: Request, bucketName: string) => {
  try {
    const formData = await unstable_parseMultipartFormData(
      request,
      uploadHandler
    );
    const uploadKey = formData.get("uploadKey");
    if (uploadKey === null) {
      throw serverError({ message: "Something went wrong on upload." });
    }
    const uploadHandlerResponseJSON = formData.get(uploadKey as string);
    if (uploadHandlerResponseJSON === null) {
      throw serverError({ message: "Something went wrong on upload." });
    }
    const uploadHandlerResponse: { buffer: Buffer; path: string } = JSON.parse(
      uploadHandlerResponseJSON as string
    );

    const { data, error } = await persistUpload(
      uploadHandlerResponse.path,
      uploadHandlerResponse.buffer,
      bucketName
    );
    validatePersistence(error, data, uploadHandlerResponse.path);

    formData.append(uploadKey as string, uploadHandlerResponse.path);

    return formData;
  } catch (exception) {
    throw serverError({ message: "Something went wrong on upload." });
  }
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
