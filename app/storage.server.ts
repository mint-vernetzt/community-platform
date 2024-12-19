import type { Document } from "@prisma/client";
import type { UploadHandler } from "@remix-run/node";
import {
  unstable_composeUploadHandlers,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { type SupabaseClient } from "@supabase/supabase-js";
import { fileTypeFromBuffer } from "file-type";
import JSZip from "jszip";
import { invariantResponse } from "./lib/utils/response";
import { createHashFromString } from "./utils.server";

const uploadKeys = ["avatar", "background", "logo", "document"];
const imageUploadKeys = ["avatar", "background", "logo"];

export function generatePathName(
  extension: string,
  hash: string,
  name: string
) {
  return `${hash.substring(0, 2)}/${hash.substring(2)}/${name}.${extension}`;
}

const uploadHandler: UploadHandler = async (part) => {
  // TODO: remove file-type package and use contentType...only if Remix uses file header
  const { data, name, filename } = part;

  const bytes = [];
  for await (const chunk of data) {
    bytes.push(...chunk);
  }

  const array = new Uint8Array(bytes);

  const buffer = Buffer.from(array.buffer);

  if (!uploadKeys.includes(name)) {
    return buffer.toString();
  }

  const hash = await createHashFromString(buffer.toString());
  const fileTypeResult = await fileTypeFromBuffer(buffer);
  if (fileTypeResult === undefined) {
    console.error(
      "The mime type of the file could not be read from file header."
    );
    invariantResponse(false, "Server Error", { status: 500 });
  }
  if (name === "document" && fileTypeResult.mime !== "application/pdf") {
    console.error(
      "Document not of type application/pdf and could not be uploaded."
    );
    invariantResponse(false, "Server Error", { status: 500 });
  }
  if (
    imageUploadKeys.includes(name) &&
    !fileTypeResult.mime.includes("image/")
  ) {
    console.error("Image not of type image/* and could not be uploaded.");
    invariantResponse(false, "Server Error", { status: 500 });
  }
  const path = generatePathName(fileTypeResult.ext, hash, name);
  const sizeInBytes = buffer.length;

  return JSON.stringify({
    buffer,
    path,
    filename,
    extension: fileTypeResult.ext,
    mimeType: fileTypeResult.mime,
    sizeInBytes,
  });
};

async function persistUpload(
  authClient: SupabaseClient,
  path: string,
  buffer: Buffer,
  bucketName: string,
  mimeType: string
) {
  return await authClient.storage.from(bucketName).upload(path, buffer, {
    upsert: true,
    contentType: mimeType,
  });
}

// TODO: fix any type
function validatePersistence(
  authClient: SupabaseClient,
  error: any,
  data: any,
  path: string,
  bucketName?: string
) {
  if (error || data === null) {
    console.error({ error });
    invariantResponse(false, "Server Error", { status: 500 });
  }

  if (getPublicURL(authClient, path, bucketName) === null) {
    console.error("Requested public url is null.");
    invariantResponse(false, "Server Error", { status: 500 });
  }
}

export const parseMultipart = async (request: Request) => {
  try {
    const formData = await unstable_parseMultipartFormData(
      request,
      unstable_composeUploadHandlers(uploadHandler)
    );
    const uploadKey = formData.get("uploadKey");
    if (uploadKey === null) {
      console.error("No upload Key");
      invariantResponse(false, "Server Error", { status: 500 });
    }
    // TODO: can this type assertion be removed and proofen by code?
    const uploadHandlerResponseJSON = formData.get(uploadKey as string);
    if (uploadHandlerResponseJSON === null) {
      console.error("Upload Handler Response is null");
      invariantResponse(false, "Server Error", { status: 500 });
    }
    const uploadHandlerResponse: {
      buffer: {
        type: "Buffer";
        data: number[];
      };
      path: string;
      filename: string;
      extension: string;
      mimeType: string;
      sizeInBytes: number;
      // TODO: can this type assertion be removed and proofen by code?
    } = JSON.parse(uploadHandlerResponseJSON as string);
    // Convert buffer.data (number[]) to Buffer
    const buffer = Buffer.from(uploadHandlerResponse.buffer.data);
    if (buffer.length === 0) {
      console.error("Cannot upload empty file.");
      invariantResponse(false, "Bad request", { status: 400 });
    }

    if (buffer.length > 5_000_000) {
      console.error("File is too big. Current limit is 5MB on server side.");
      invariantResponse(false, "Bad request", { status: 400 });
    }

    return {
      uploadHandlerResponse: {
        ...uploadHandlerResponse,
        buffer,
      },
      formData,
    };
  } catch (error) {
    console.error({ error });
    invariantResponse(false, "Server error", { status: 500 });
  }
};

export async function doPersistUpload(
  authClient: SupabaseClient,
  bucketName: string,
  uploadHandlerResponse: {
    buffer: Buffer;
    path: string;
    filename: string;
    extension: string;
    mimeType: string;
    sizeInBytes: number;
  }
) {
  const { data, error } = await persistUpload(
    authClient,
    uploadHandlerResponse.path,
    uploadHandlerResponse.buffer,
    bucketName,
    uploadHandlerResponse.mimeType
  );
  validatePersistence(
    authClient,
    error,
    data,
    uploadHandlerResponse.path,
    bucketName
  );

  return true;
}

export function getPublicURL(
  authClient: SupabaseClient,
  relativePath: string,
  bucket = "images"
) {
  const {
    data: { publicUrl },
  } = authClient.storage.from(bucket).getPublicUrl(relativePath);

  if (publicUrl === "") {
    console.error("Requested public url is an empty string.");
    invariantResponse(false, "Server Error", { status: 500 });
  }

  if (
    bucket === "images" &&
    process.env.SUPABASE_IMG_URL !== undefined &&
    process.env.SUPABASE_URL !== undefined
  ) {
    return publicUrl.replace(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_IMG_URL
    );
  }

  return publicUrl;
}

export async function download(
  authClient: SupabaseClient,
  relativePath: string,
  bucket = "documents"
) {
  const { data, error } = await authClient.storage
    .from(bucket)
    .download(relativePath);

  if (data === null || error !== null) {
    console.error({ error });
    invariantResponse(false, "Server Error", { status: 500 });
  }
  return data;
}

export async function getDownloadDocumentsResponse(
  authClient: SupabaseClient,
  documents: Pick<Document, "filename" | "path">[],
  zipFilename = "Dokumente.zip"
) {
  if (documents.length === 0) {
    console.error("Documents array is empty.");
    invariantResponse(false, "Bad request", { status: 400 });
  }

  const files = await Promise.all(
    documents.map(async (document) => {
      const blob = await download(authClient, document.path);
      const file = {
        name: document.filename,
        content: await blob.arrayBuffer(),
        type: blob.type,
      };
      return file;
    })
  );

  let file;
  let filename;
  let contentType;
  if (files.length === 1) {
    file = files[0].content;
    filename = files[0].name;
    contentType = files[0].type;
  } else {
    const zip = new JSZip();
    files.map((file) => {
      zip.file(file.name, file.content);
      return null;
    });
    file = await zip.generateAsync({ type: "arraybuffer" });
    contentType = "application/zip";
    filename = `${zipFilename}`;
  }

  // TODO: Check for missing headers
  return new Response(file, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function remove(
  authClient: SupabaseClient,
  paths: string[],
  bucket = "images"
) {
  const { data, error } = await authClient.storage.from(bucket).remove(paths);

  if (data === null || error !== null) {
    console.error({ error });
    invariantResponse(false, "Server Error", { status: 500 });
  }
}
