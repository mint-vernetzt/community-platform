import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { prismaClient } from "~/prisma";
import type { UploadKey } from "./schema";

export async function removeImageFromProfile(
  profileId: string,
  name: UploadKey
) {
  return await prismaClient.profile.update({
    where: {
      id: profileId,
    },
    data: {
      [name]: null,
      updatedAt: new Date(),
    },
  });
}

export async function removeImageFromOrganization(
  slug: string,
  name: UploadKey
) {
  return await prismaClient.organization.update({
    where: {
      slug,
    },
    data: {
      [name]: null,
      updatedAt: new Date(),
    },
  });
}

export async function removeImageFromEvent(slug: string, name: UploadKey) {
  return await prismaClient.event.update({
    where: {
      slug,
    },
    data: {
      [name]: null,
      updatedAt: new Date(),
    },
  });
}

export async function removeImageFromStorage(
  supabaseClient: SupabaseClient,
  path: string
) {
  const { error } = await supabaseClient.storage.from("images").remove([path]);

  return error === null;
}
