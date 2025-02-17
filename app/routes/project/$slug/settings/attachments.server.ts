import { type SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { createHashFromString } from "~/utils.server";
import { getExtension } from "./attachments";
import { fileTypeFromBuffer } from "file-type";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type ProjectAttachmentSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["project/$slug/settings/attachments"];

export async function hasValidMimeType(file: File, allowedTypes: string[]) {
  const buffer = await file.arrayBuffer();
  const fileTypeResult = await fileTypeFromBuffer(buffer);
  return (
    fileTypeResult !== undefined && allowedTypes.includes(fileTypeResult.mime)
  );
}

// TODO: DRY

export async function storeDocument(
  authClient: SupabaseClient,
  options: { slug: string; filename: string; document: File }
) {
  const { slug, filename, document } = options;

  const mimeType = document.type;
  const extension = getExtension(filename);
  const sizeInMB = Math.round((document.size / 1000 / 1000) * 100) / 100;
  const buffer = await document.arrayBuffer();
  const contentHash = await createHashFromString(buffer.toString());

  const path = `${contentHash.substring(0, 2)}/${contentHash.substring(
    2
  )}/${filename}`;

  const result = await authClient.storage
    .from("documents")
    .upload(path, buffer, { upsert: true, contentType: mimeType });

  if (result.error !== null) {
    return result.error;
  }

  // validate persistency in storage
  const publicURL = getPublicURL(authClient, "documents", path);

  if (publicURL === null) {
    return new Error("Persistency check failed.");
  }

  await prismaClient.project.update({
    where: {
      slug,
    },
    data: {
      documents: {
        create: {
          document: {
            create: {
              filename,
              path,
              extension,
              sizeInMB,
              mimeType,
            },
          },
        },
      },
      updatedAt: new Date(),
    },
  });

  return null;
}

export async function storeImage(
  authClient: SupabaseClient,
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: { slug: string; filename: string; image: any }
) {
  const { slug, filename, image } = options;

  const mimeType = image.type;
  const extension = filename.substring(
    filename.lastIndexOf(".") + 1,
    filename.length
  );
  const sizeInMB = Math.round((image.size / 1000 / 1000) * 100) / 100;
  const buffer = await image.arrayBuffer();
  const contentHash = await createHashFromString(buffer.toString());

  const path = `${contentHash.substring(0, 2)}/${contentHash.substring(
    2
  )}/${filename}`;

  const result = await authClient.storage
    .from("images")
    .upload(path, buffer, { upsert: true, contentType: mimeType });

  if (result.error !== null) {
    return result.error;
  }

  // validate persistency in storage
  const publicURL = getPublicURL(authClient, "images", path);

  if (publicURL === null) {
    return new Error("Persistency check failed.");
  }

  await prismaClient.project.update({
    where: {
      slug,
    },
    data: {
      images: {
        create: {
          image: {
            create: {
              filename,
              path,
              extension,
              sizeInMB,
              mimeType,
            },
          },
        },
      },
      updatedAt: new Date(),
    },
  });

  return null;
}
