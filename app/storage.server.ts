import { LocalFileStorage } from "@mjackson/file-storage/local";
import { parseFormData, type FileUpload } from "@mjackson/form-data-parser";
import type { Document } from "@prisma/client";
import { type SupabaseClient } from "@supabase/supabase-js";
import { fileTypeFromBlob } from "file-type";
import JSZip from "jszip";
import { Readable } from "stream";
import { createAuthClient } from "./auth.server";
import { invariantResponse } from "./lib/utils/response";
import {
  BUCKET_NAME_DOCUMENTS,
  BUCKET_NAME_IMAGES,
  DOCUMENT_MIME_TYPES,
  FILE_FIELD_NAME,
  IMAGE_MIME_TYPES,
} from "./storage.shared";
import { createHashFromString } from "./utils.server";

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

export async function deleteAllTemporaryFiles() {
  const items = await fileStorage.list(); // List all items in the fileStorage
  for (const file of items.files) {
    await fileStorage.remove(file.key); // Delete each item by its name
  }
}

export async function parseMultipartFormData(request: Request) {
  let formData;
  try {
    formData = await parseFormData(request, uploadHandler);
  } catch (error) {
    await deleteAllTemporaryFiles();
    return {
      error,
      formData: null,
    };
  }
  return {
    error: null,
    formData,
  };
}

export async function uploadFileFromMultipartFormData(
  request: Request,
  parsedFormData: {
    file: File;
    bucketName: string;
  }
) {
  const { file, bucketName } = parsedFormData;
  if (
    bucketName !== BUCKET_NAME_DOCUMENTS &&
    bucketName !== BUCKET_NAME_IMAGES
  ) {
    await deleteAllTemporaryFiles();
    return {
      path: null,
      fileType: null,
      error: new Error("Bad request - No bucket name"),
    };
  }
  if (file === null || typeof file === "string") {
    await deleteAllTemporaryFiles();
    return {
      path: null,
      fileType: null,
      error: new Error("Bad request - Not a file"),
    };
  }
  const fileType = await fileTypeFromBlob(file);
  if (typeof fileType === "undefined") {
    await deleteAllTemporaryFiles();
    return {
      path: null,
      fileType: null,
      error: new Error("Bad request - File type undefined"),
    };
  }
  if (
    (bucketName === "documents" &&
      DOCUMENT_MIME_TYPES.includes(fileType.mime) === false) ||
    (bucketName === "images" &&
      IMAGE_MIME_TYPES.includes(fileType.mime) === false)
  ) {
    await deleteAllTemporaryFiles();
    return {
      path: null,
      fileType: null,
      error: new Error("Bad request - File type not allowed"),
    };
  }

  let path;
  let fileStream;
  try {
    path = generatePathName(createHashFromString(file.name), fileType.ext);
    fileStream = Readable.from(streamToAsyncIterator(file.stream()));
  } catch (error) {
    await deleteAllTemporaryFiles();
    return {
      path: null,
      fileType: null,
      error,
    };
  }

  const { authClient } = createAuthClient(request);
  const { data, error } = await authClient.storage
    .from(bucketName)
    .upload(path, fileStream, {
      upsert: true,
      contentType: fileType.mime,
      duplex: "half",
    });

  await deleteAllTemporaryFiles();
  if (data === null || error !== null) {
    return {
      path: null,
      fileType: null,
      error,
    };
  }

  return {
    path,
    fileType,
    error: null,
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
