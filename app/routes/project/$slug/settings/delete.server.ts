import { prismaClient } from "~/prisma.server";

export async function getProfileByUserId(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      username: true,
    },
    where: {
      id,
    },
  });
}

export async function getProjectBySlug(slug: string) {
  return await prismaClient.project.findUnique({
    select: {
      id: true,
      name: true,
    },
    where: {
      slug,
    },
  });
}
