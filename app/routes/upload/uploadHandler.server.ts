// import type { SupabaseClient } from "@supabase/supabase-js";
// import { fileTypeFromBuffer } from "file-type";
import { prismaClient } from "~/prisma.server";
// import { getPublicURL } from "~/storage.server";
// import { createHashFromString, triggerEntityScore } from "~/utils.server";
import { triggerEntityScore } from "~/utils.server";
// import { uploadKeys } from "./utils.server";
// import { invariantResponse } from "~/lib/utils/response";

// const imageUploadKeys = ["avatar", "logo", "background"];

// function generatePathName(extension: string, hash: string, name: string) {
//   return `${hash.substring(0, 2)}/${hash.substring(2)}/${name}.${extension}`;
// }

// TODO: Reimplement upload handling (multipart form data parsing) -> poc: see app/routes/status.tsx
// const uploadHandler: UploadHandler = async (part) => {
//   // TODO: remove file-type package and use contentType...only if Remix uses file header
//   const { data, name, filename } = part;

//   const bytes = [];
//   for await (const chunk of data) {
//     bytes.push(...chunk);
//   }

//   const array = new Uint8Array(bytes);

//   const buffer = Buffer.from(array.buffer);

//   if (!uploadKeys.includes(name)) {
//     return buffer.toString();
//   }

//   const hash = await createHashFromString(buffer.toString());
//   const fileTypeResult = await fileTypeFromBuffer(buffer);

//   if (fileTypeResult === undefined) {
//     console.error(
//       "The mime type of the file could not be read from file header."
//     );
//     invariantResponse(false, "Server Error", { status: 500 });
//   }
//   if (name === "document" && fileTypeResult.mime !== "application/pdf") {
//     console.error(
//       "Document not of type application/pdf and could not be uploaded."
//     );
//     invariantResponse(false, "Server Error", { status: 500 });
//   }
//   if (
//     imageUploadKeys.includes(name) &&
//     !fileTypeResult.mime.includes("image/")
//   ) {
//     console.error("Image not of type image/* and could not be uploaded.");
//     invariantResponse(false, "Server Error", { status: 500 });
//   }
//   const path = generatePathName(fileTypeResult.ext, hash, name);
//   const sizeInBytes = buffer.length;

//   return JSON.stringify({
//     buffer,
//     path,
//     filename,
//     mimeType: fileTypeResult.mime,
//     sizeInBytes,
//   });
// };

// async function persistUpload(
//   authClient: SupabaseClient,
//   path: string,
//   buffer: Buffer,
//   bucketName: string,
//   mimeType?: string
// ) {
//   return await authClient.storage.from(bucketName).upload(path, buffer, {
//     upsert: true,
//     contentType: mimeType,
//   });
// }

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

// export const upload = async (
//   authClient: SupabaseClient,
//   request: Request,
//   bucketName: string
// ) => {
// TODO: Reimplement upload handling (multipart form data parsing) -> poc: see app/routes/status.tsx
// try {
//   const formData = await unstable_parseMultipartFormData(
//     request,
//     unstable_composeUploadHandlers(uploadHandler)
//   );
//   const uploadKey = formData.get("uploadKey");
//   if (uploadKey === null) {
//     console.error("No upload Key");
//     invariantResponse(false, "Server Error", { status: 500 });
//   }
//   // TODO: can this type assertion be removed and proofen by code?
//   const uploadHandlerResponseJSON = formData.get(uploadKey as string);
//   if (uploadHandlerResponseJSON === null) {
//     console.error("Upload Handler Response is null");
//     invariantResponse(false, "Server Error", { status: 500 });
//   }
//   const uploadHandlerResponse: {
//     buffer: {
//       type: "Buffer";
//       data: number[];
//     };
//     path: string;
//     filename: string;
//     mimeType: string;
//     sizeInBytes: number;
//     // TODO: can this type assertion be removed and proofen by code?
//   } = JSON.parse(uploadHandlerResponseJSON as string);
//   // Convert buffer data to Buffer
//   const buffer = Buffer.from(uploadHandlerResponse.buffer.data);
//   if (buffer.length === 0) {
//     console.error("Cannot upload empty file.");
//     invariantResponse(false, "Bad request", { status: 400 });
//   }
//   const { data, error } = await persistUpload(
//     authClient,
//     uploadHandlerResponse.path,
//     buffer,
//     bucketName,
//     uploadHandlerResponse.mimeType
//   );
//   validatePersistence(
//     authClient,
//     error,
//     data,
//     uploadHandlerResponse.path,
//     bucketName
//   );
//   return formData;
// } catch (exception) {
//   console.error({ exception });
//   invariantResponse(false, "Server Error", { status: 500 });
// }
// };

// TODO: fix type issues
// function validatePersistence(
//   authClient: SupabaseClient,
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   error: any,
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   data: any,
//   path: string,
//   bucketName?: string
// ) {
//   if (error || data === null) {
//     console.error({ error });
//     invariantResponse(false, "Server Error", { status: 500 });
//   }

//   if (getPublicURL(authClient, path, bucketName) === null) {
//     console.error("Requested public url is null.");
//     invariantResponse(false, "Server Error", { status: 500 });
//   }
// }
