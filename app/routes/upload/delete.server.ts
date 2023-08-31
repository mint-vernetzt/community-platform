import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { prismaClient } from "~/prisma.server";
import { triggerEntityScore } from "~/utils.server";
import type { UploadKey } from "./utils.server";

export async function getOrganizationBySlug(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      teamMembers: {
        select: {
          profileId: true,
          isPrivileged: true,
        },
      },
    },
  });

  return organization;
}

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

export async function getProjectBySlug(slug: string) {
  return await prismaClient.project.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}
