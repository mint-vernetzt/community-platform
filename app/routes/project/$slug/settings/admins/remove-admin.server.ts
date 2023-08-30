import { prismaClient } from "~/prisma.server";

export async function getProjectBySlug(slug: string) {
  return await prismaClient.project.findUnique({
    select: {
      id: true,
      _count: {
        select: {
          admins: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function removeAdminFromProject(
  projectId: string,
  profileId: string
) {
  await prismaClient.adminOfProject.delete({
    where: {
      profileId_projectId: {
        profileId,
        projectId,
      },
    },
  });
}
