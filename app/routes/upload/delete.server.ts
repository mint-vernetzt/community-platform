import { prismaClient } from "~/prisma";
import { supabaseAdmin } from "~/supabase";
import { UploadKey } from "./schema";

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
    },
  });
}

export async function removeImageFromOrganitaion(
  slug: string,
  name: UploadKey
) {
  return await prismaClient.organization.update({
    where: {
      slug,
    },
    data: {
      [name]: null,
    },
  });
}

export async function removeImageFromStorage(path: string) {
  const { error } = await supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
    .from("images")
    .remove([path]);

  return error === null;
}
