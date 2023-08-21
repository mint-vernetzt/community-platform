import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import type { UploadHandler } from "@remix-run/node";
import {
  unstable_composeUploadHandlers,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { fromBuffer } from "file-type";
import { serverError } from "remix-utils";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { createHashFromString, triggerEntityScore } from "~/utils.server";
import { uploadKeys } from "./schema";

const imageUploadKeys = ["avatar", "logo", "background"];

function generatePathName(extension: string, hash: string, name: string) {
  return `${hash.substring(0, 2)}/${hash.substring(2)}/${name}.${extension}`;
}

const uploadHandler: UploadHandler = async (part) => {
  // TODO: remove file-type package and use contentType...only if Remix uses file header
  const { contentType, data, name, filename } = part;

  let bytes = [];
  for await (let chunk of data) {
    bytes.push(...chunk);
  }

  const array = new Uint8Array(bytes);

  const buffer = Buffer.from(array.buffer);

  if (!uploadKeys.includes(name)) {
    return buffer.toString();
  }

  const hash = await createHashFromString(buffer.toString());
  const fileTypeResult = await fromBuffer(buffer);

  if (fileTypeResult === undefined) {
    console.log("Der Dateityp (MIME type) konnte nicht gelesen werden.");
    throw serverError({
      message: "Der Dateityp (MIME type) konnte nicht gelesen werden.",
    });
  }
  if (name === "document" && fileTypeResult.mime !== "application/pdf") {
    console.log(
      "Aktuell können ausschließlich Dateien im PDF-Format hochgeladen werden."
    );
    throw serverError({
      message:
        "Aktuell können ausschließlich Dateien im PDF-Format hochgeladen werden.",
    });
  }
  if (
    imageUploadKeys.includes(name) &&
    !fileTypeResult.mime.includes("image/")
  ) {
    console.log(
      "Die Datei entspricht keinem gängigem Bildformat und konnte somit nicht hochgeladen werden."
    );
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
  authClient: SupabaseClient,
  path: string,
  buffer: Buffer,
  bucketName: string,
  mimeType?: string
) {
  return await authClient.storage.from(bucketName).upload(path, buffer, {
    upsert: true,
    contentType: mimeType,
  });
}

export async function updateUserProfileImage(
  id: string,
  name: string,
  path: string
) {
  await prismaClient.profile.update({
    where: {
      id,
    },
    data: {
      [name]: path,
      updatedAt: new Date(),
    },
  });
  await triggerEntityScore({ entity: "profile", where: { id } });
}

export async function updateOrganizationProfileImage(
  slug: string,
  name: string,
  path: string
) {
  await prismaClient.organization.update({
    where: {
      slug: slug,
    },
    data: {
      [name]: path,
    },
  });
  await triggerEntityScore({ entity: "organization", where: { slug } });
}

export async function updateEventBackgroundImage(
  slug: string,
  name: string,
  path: string
) {
  return await prismaClient.event.update({
    where: {
      slug: slug,
    },
    data: {
      [name]: path,
    },
  });
}

export async function updateProjectBackgroundImage(
  slug: string,
  name: string,
  path: string
) {
  return await prismaClient.project.update({
    where: {
      slug: slug,
    },
    data: {
      [name]: path,
    },
  });
}

export const upload = async (
  authClient: SupabaseClient,
  request: Request,
  bucketName: string
) => {
  try {
    const formData = await unstable_parseMultipartFormData(
      request,
      unstable_composeUploadHandlers(uploadHandler)
    );

    const uploadKey = formData.get("uploadKey");
    if (uploadKey === null) {
      console.log("No upload Key");
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
      authClient,
      uploadHandlerResponse.path,
      buffer,
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

    return formData;
  } catch (exception) {
    throw serverError({ message: "Something went wrong on upload." });
  }
};

function validatePersistence(
  authClient: SupabaseClient,
  error: any,
  data: any,
  path: string,
  bucketName?: string
) {
  if (error || data === null) {
    throw serverError({ message: "Hochladen fehlgeschlagen." });
  }

  if (getPublicURL(authClient, path, bucketName) === null) {
    throw serverError({
      message: "Die angefragte URL konnte nicht gefunden werden.",
    });
  }
}
