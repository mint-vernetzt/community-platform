import { parseFormData } from "@mjackson/form-data-parser";
import type { Document } from "@prisma/client";
import { type SupabaseClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { invariantResponse } from "./lib/utils/response";
import { fileTypeFromBlob } from "file-type";
import {
  DOCUMENT_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_UPLOAD_FILE_SIZE,
} from "./storage.shared";
import { createHashFromString } from "./utils.server";

export function generatePathName(hash: string, extension: string) {
  return `${hash.substring(0, 2)}/${hash.substring(
    2,
    hash.length - 2
  )}/${hash.substring(hash.length - 2)}.${extension}`;
}

export async function parseMultipartFormData(request: Request) {
  let formData;
  try {
    formData = await parseFormData(request, {
      maxFileSize: MAX_UPLOAD_FILE_SIZE,
    });
  } catch (error) {
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

export async function uploadFileToStorage(options: {
  file: File;
  bucket: string;
  authClient: SupabaseClient;
}) {
  const { file, bucket, authClient } = options;

  const fileType = await fileTypeFromBlob(file);
  if (typeof fileType === "undefined") {
    const error = new Error("Bad request - File type undefined");
    return {
      fileMetadataForDatabase: null,
      error,
    };
  }
  if (
    (bucket === "documents" &&
      DOCUMENT_MIME_TYPES.includes(fileType.mime) === false) ||
    (bucket === "images" && IMAGE_MIME_TYPES.includes(fileType.mime) === false)
  ) {
    const error = new Error("Bad request - File type not allowed");
    return {
      fileMetadataForDatabase: null,
      error,
    };
  }

  const path = generatePathName(createHashFromString(file.name), fileType.ext);
  const { error: storageError } = await authClient.storage
    .from(bucket)
    .upload(path, file.stream(), {
      upsert: true,
      contentType: fileType.mime,
      duplex: "half",
    });

  if (storageError !== null) {
    return {
      fileMetadataForDatabase: null,
      error: storageError,
    };
  }

  return {
    fileMetadataForDatabase: {
      filename: file.name,
      path: path,
      extension: fileType.ext,
      sizeInMB: Math.round((file.size / 1000 / 1000) * 100) / 100,
      mimeType: fileType.mime,
    },
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
