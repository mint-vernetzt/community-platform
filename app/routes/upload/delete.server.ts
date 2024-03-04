import type { SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { triggerEntityScore } from "~/utils.server";
import type { UploadKey } from "./utils.server";

export async function removeImageFromProfile(
  profileId: string,
  name: UploadKey
) {
  await prismaClient.profile.update({
    where: {
      id: profileId,
    },
    data: {
      [name]: null,
      updatedAt: new Date(),
    },
  });
  await triggerEntityScore({ entity: "profile", where: { id: profileId } });
}

export async function removeImageFromOrganization(
  slug: string,
  name: UploadKey
) {
  await prismaClient.organization.update({
    where: {
      slug,
    },
    data: {
      [name]: null,
      updatedAt: new Date(),
    },
  });
  await triggerEntityScore({ entity: "organization", where: { slug } });
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

export async function removeImageFromProject(slug: string, name: UploadKey) {
  return await prismaClient.project.update({
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
  authClient: SupabaseClient,
  path: string
) {
  const { error } = await authClient.storage.from("images").remove([path]);

  return error === null;
}
