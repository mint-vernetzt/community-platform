import { prismaClient } from "~/prisma";
import { supabaseAdmin } from "~/supabase";

export async function removeImageFromProfile(profileId: string, name: string) {
  return await prismaClient.profile.update({
    where: {
      id: profileId,
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
