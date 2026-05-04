import { type SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { uploadFileToStorage } from "~/storage.server";

export async function uploadDocumentToEvent(options: {
  authClient: SupabaseClient;
  file: File;
  slug: string;
}) {
  const { authClient, file, slug } = options;
  const { fileMetadataForDatabase, error } = await uploadFileToStorage({
    file,
    authClient,
    bucket: "documents",
  });
  if (error !== null) {
    throw error;
  }
  await prismaClient.event.update({
    where: {
      slug,
    },
    data: {
      documents: {
        create: {
          document: {
            create: { ...fileMetadataForDatabase },
          },
        },
      },
      updatedAt: new Date(),
    },
  });
}
