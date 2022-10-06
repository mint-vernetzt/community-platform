import { fromBuffer } from "file-type";
import { unstable_parseMultipartFormData, UploadHandler } from "remix";
import { serverError } from "remix-utils";
import { prismaClient } from "~/prisma";
import { getPublicURL } from "~/storage.server";
import { supabaseAdmin } from "~/supabase";
import { createHashFromString, stream2buffer } from "~/utils.server";
import { uploadKeys } from "./schema";

const imageUploadKeys = ["avatar", "logo", "background"];

function generatePathName(extension: string, hash: string, name: string) {
  return `${hash.substring(0, 2)}/${hash.substring(2)}/${name}.${extension}`;
}

const uploadHandler: UploadHandler = async ({ name, stream, filename }) => {
  if (!uploadKeys.includes(name)) {
    stream.resume();
    return;
  }

  const buffer = await stream2buffer(stream);
  const hash = await createHashFromString(buffer.toString());
  const fileTypeResult = await fromBuffer(buffer);
  if (fileTypeResult === undefined) {
    throw serverError({
      message: "Der Dateityp (MIME type) konnte nicht gelesen werden.",
    });
  }
  if (name === "document" && fileTypeResult.mime !== "application/pdf") {
    throw serverError({
      message:
        "Aktuell können ausschließlich Dateien im PDF-Format hochgeladen werden.",
    });
  }
  if (
    imageUploadKeys.includes(name) &&
    !fileTypeResult.mime.includes("image/")
  ) {
    throw serverError({
      message:
        "Die Datei entspricht keinem gängigem Bildformat und konnte somit nicht hochgeladen werden.",
    });
  }
  const path = generatePathName(fileTypeResult.ext, hash, name);
  const sizeInBytes = buffer.length;

  return JSON.stringify({
    buffer,
    path,
    filename,
    mimeType: fileTypeResult.mime,
    sizeInBytes,
  });
};

async function persistUpload(
  path: string,
  buffer: Buffer,
  bucketName: string,
  mimeType?: string
) {
  return await supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
    .from(bucketName)
    .upload(path, buffer, {
      upsert: true,
      contentType: mimeType,
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
    const uploadHandlerResponse: {
      buffer: {
        type: "Buffer";
        data: number[];
      };
      path: string;
      filename: string;
      mimeType: string;
      sizeInBytes: number;
    } = JSON.parse(uploadHandlerResponseJSON as string);
    // Convert buffer data to Buffer
    const buffer = Buffer.from(uploadHandlerResponse.buffer.data);
    if (buffer.length === 0) {
      throw serverError({ message: "Cannot upload empty file." });
    }

    const { data, error } = await persistUpload(
      uploadHandlerResponse.path,
      buffer,
      bucketName,
      uploadHandlerResponse.mimeType
    );
    validatePersistence(error, data, uploadHandlerResponse.path, bucketName);

    return formData;
  } catch (exception) {
    throw serverError({ message: "Something went wrong on upload." });
  }
};

function validatePersistence(
  error: any,
  data: any,
  path: string,
  bucketName?: string
) {
  if (error || data === null) {
    throw serverError({ message: "Hochladen fehlgeschlagen." });
  }

  if (getPublicURL(path, bucketName) === null) {
    throw serverError({
      message: "Die angefragte URL konnte nicht gefunden werden.",
    });
  }
}
