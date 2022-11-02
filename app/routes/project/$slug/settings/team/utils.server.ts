import { prismaClient } from "~/prisma";

export async function connectProfileToProject(
  projectId: string,
  profileId: string
) {
  await prismaClient.teamMemberOfProject.create({
    data: {
      projectId,
      profileId,
    },
  });
}

export async function disconnectProfileFromProject(
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

export async function updateProjectTeamMemberPrivilege(
  projectId: string,
  teamMemberId: string,
  isPrivileged: boolean
) {
  await prismaClient.teamMemberOfProject.update({
    where: {
      profileId_projectId: {
        profileId: teamMemberId,
        projectId,
      },
    },
    data: {
      isPrivileged,
    },
  });
}
