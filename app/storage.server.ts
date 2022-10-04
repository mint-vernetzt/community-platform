import { serverError } from "remix-utils";
import { supabaseAdmin } from "./supabase";
import { unstable_parseMultipartFormData, UploadHandler } from "remix";
import { createHashFromString, stream2buffer } from "~/utils.server";
import { fromBuffer } from "file-type";

const uploadKeys = ["avatar", "background", "logo", "document"];
const imageUploadKeys = ["avatar", "background", "logo"];

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
  console.log("\nFILE TYPE RESULT\n", fileTypeResult);
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
    // Convert buffer.data (number[]) to Buffer
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

export function getPublicURL(relativePath: string, bucket = "images") {
  const { publicURL, error } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
    .from(bucket)
    .getPublicUrl(relativePath);

  if (publicURL === null || error !== null) {
    throw serverError({
      message: "Die öffentliche URL der Datei konnte nicht erzeugt werden.",
    });
  }
  return publicURL;
}

export async function download(relativePath: string, bucket = "documents") {
  const { data, error } = await supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
    .from(bucket)
    .download(relativePath);

  if (data === null || error !== null) {
    throw serverError({
      message: "Datei konnte nicht heruntergeladen werden.",
    });
  }
  return data;
}

export async function remove(paths: string[], bucket = "images") {
  const { data, error } = await supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
    .from(bucket)
    .remove(paths);

  if (data === null || error !== null) {
    throw serverError({
      message: "Datei konnte nicht gelöscht werden.",
    });
  }
}
