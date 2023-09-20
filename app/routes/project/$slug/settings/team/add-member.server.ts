import { prismaClient } from "~/prisma.server";

export async function getProfileById(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      teamMemberOfProjects: {
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

export async function addTeamMemberToProject(
  projectId: string,
  profileId: string
) {
  await prismaClient.teamMemberOfProject.create({
    data: {
      profileId,
      projectId,
    },
  });
}
