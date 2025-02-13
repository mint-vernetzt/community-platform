import type { Document } from "@prisma/client";
import { type SupabaseClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { invariantResponse } from "./lib/utils/response";
import { LocalFileStorage } from "@mjackson/file-storage/local";
import { parseFormData, type FileUpload } from "@mjackson/form-data-parser";
import { fileTypeFromBlob } from "file-type";
import { createHashFromString } from "./utils.server";
import { Readable } from "stream";
import { createAuthClient } from "./auth.server";
import {
  BUCKET_FIELD_NAME,
  BUCKET_NAME_DOCUMENTS,
  BUCKET_NAME_IMAGES,
  DOCUMENT_MIME_TYPES,
  FILE_FIELD_NAME,
  IMAGE_MIME_TYPES,
} from "./storage.shared";

export function generatePathName(hash: string, extension: string) {
  return `${hash.substring(0, 2)}/${hash.substring(
    2,
    hash.length - 2
  )}/${hash.substring(hash.length - 2)}.${extension}`;
}

export async function* streamToAsyncIterator(
  stream: ReadableStream<Uint8Array<ArrayBufferLike>>
) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } catch (error) {
    console.error({ error });
    invariantResponse(false, "Server Error", { status: 500 });
  } finally {
    reader.releaseLock();
  }
}

export const fileStorage = new LocalFileStorage(`temporary-upload-storage`);

export async function uploadHandler(fileUpload: FileUpload) {
  if (fileUpload.fieldName === FILE_FIELD_NAME) {
    // FileUpload objects are not meant to stick around for very long (they are
    // streaming data from the request.body!) so we should store them as soon as
    // possible.
    await fileStorage.set(fileUpload.fieldName, fileUpload);

    // Return a File for the FormData object. This is a LazyFile that knows how
    // to access the file's content if needed (using e.g. file.stream()) but
    // waits until it is requested to actually read anything.
    return fileStorage.get(fileUpload.fieldName);
  }
}

async function deleteAllTemporaryFiles() {
  const items = await fileStorage.list(); // List all items in the fileStorage
  for (const file of items.files) {
    await fileStorage.remove(file.key); // Delete each item by its name
  }
}

export async function uploadFileFromMultipartFormData(request: Request) {
  let formData;
  try {
    formData = await parseFormData(request, uploadHandler);
  } catch (error) {
    console.error({ error });
    await deleteAllTemporaryFiles();
    invariantResponse(false, "Server Error - Failed to parse multipart", {
      status: 500,
    });
  }
  const bucketName = formData.get(BUCKET_FIELD_NAME);
  if (
    bucketName !== BUCKET_NAME_DOCUMENTS &&
    bucketName !== BUCKET_NAME_IMAGES
  ) {
    await deleteAllTemporaryFiles();
    invariantResponse(false, "Bad request - No bucket name", {
      status: 400,
    });
  }
  const file = formData.get(FILE_FIELD_NAME);
  if (file === null || typeof file === "string") {
    await deleteAllTemporaryFiles();
    invariantResponse(false, "Bad request - Not a file", {
      status: 400,
    });
  }
  const fileType = await fileTypeFromBlob(file);
  if (typeof fileType === "undefined") {
    await deleteAllTemporaryFiles();
    invariantResponse(false, "Bad request - File type undefined", {
      status: 400,
    });
  }
  if (
    (bucketName === "documents" &&
      DOCUMENT_MIME_TYPES.includes(fileType.mime) === false) ||
    (bucketName === "images" &&
      IMAGE_MIME_TYPES.includes(fileType.mime) === false)
  ) {
    await deleteAllTemporaryFiles();
    invariantResponse(false, "Bad request - File type not allowed", {
      status: 400,
    });
  }
  const path = generatePathName(createHashFromString(file.name), fileType.ext);
  const fileStream = Readable.from(streamToAsyncIterator(file.stream()));

  const { authClient } = await createAuthClient(request);
  const { data, error } = await authClient.storage
    .from(bucketName)
    .upload(path, fileStream, {
      upsert: true,
      contentType: fileType.mime,
      duplex: "half",
    });

  await deleteAllTemporaryFiles();
  invariantResponse(
    error === null && data !== null,
    "Server Error - Uploading file",
    {
      status: 500,
    }
  );

  return {
    formData,
    path,
    file,
    fileType,
  };
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
