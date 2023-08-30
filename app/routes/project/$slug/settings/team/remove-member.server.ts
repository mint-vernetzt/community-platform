import { prismaClient } from "~/prisma.server";

export async function getProjectBySlug(slug: string) {
  return await prismaClient.project.findUnique({
    select: {
      id: true,
      _count: {
        select: {
          teamMembers: true,
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function removeTeamMemberFromProject(
  projectId: string,
  profileId: string
) {
  await prismaClient.teamMemberOfProject.delete({
    where: {
      profileId_projectId: {
        profileId,
        projectId,
      },
    },
  });
}
