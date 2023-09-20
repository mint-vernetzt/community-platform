import { prismaClient } from "~/prisma.server";

export async function getProfileById(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      administeredProjects: {
        select: {
          project: {
            select: {
              slug: true,
            },
          },
        },
      },
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
    },
    where: {
      slug,
    },
  });
}

export async function addAdminToProject(projectId: string, profileId: string) {
  await prismaClient.adminOfProject.create({
    data: {
      profileId,
      projectId,
    },
  });
}
